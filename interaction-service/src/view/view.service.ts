import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CreateViewDto } from './dto/create-view.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { View } from './entities/view.entity';
import { DataSource, In, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { ContentServiceType } from 'src/enums/ContentType';
import { ContentClient } from 'src/client/content.client';
import { UserRole } from 'src/enums/user_role.type';

@Injectable()
export class ViewService {
  private readonly logger = new Logger(ViewService.name);
  constructor(
    @InjectRepository(View) private viewRepo: Repository<View>,
    private context: ContextService,
    private outboxEventService: OutboxEventsService,
    private contentClient: ContentClient,
    private dataSource: DataSource,
  ) {}

  private async resolveContentId(dto: CreateViewDto): Promise<
    | {
        userId: string;
        likeCount: number;
        caption?: string;
        tags?: {
          id: number;
          name: string;
        }[];
      }
    | undefined
  > {
    switch (dto.targetType) {
      case ContentServiceType.POST:
        const postRes = await this.contentClient.getPost(dto.targetId);
        return {
          likeCount: postRes.likeCount,
          userId: postRes.userId,
          tags: postRes.tags,
          caption: postRes.caption,
        };

      case ContentServiceType.SHORT:
        const shortRes = await this.contentClient.getShort(dto.targetId);
        return {
          likeCount: shortRes.likeCount,
          userId: shortRes.userId,
          tags: shortRes.tags,
          caption: shortRes.caption,
        };

      case ContentServiceType.STORY:
        return undefined;

      default:
        return undefined;
    }
  }

  async create(createViewDto: CreateViewDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const userId = this.context.getUserId();
    const role = this.context.getRole();

    try {
      if (role !== UserRole.CLIENT) {
        throw new ForbiddenException('Only clients can perform this action');
      }

      const savedView = await queryRunner.manager.save(View, {
        ...createViewDto,
        userId,
        avatarUrl: this.context.getAvatarUrl(),
        username: this.context.getUsername(),
      });

      if (savedView.targetType !== ContentServiceType.STORY) {
        const content = await this.resolveContentId(createViewDto);

        if (!content) {
          throw new Error('Content not found');
        }

        await this.outboxEventService.emitView(queryRunner.manager, {
          eventType: 'content.viewed',
          payload: {
            watchTime: createViewDto.watchTime,
            contentId: createViewDto.targetId,
            senderId: userId,
            contentType: createViewDto.targetType,
            timestamp: new Date().toISOString(),
            tags: content.tags,
            caption: content.caption,
          },
        });
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    contentId: number,
    contentType: ContentServiceType,
    page: number,
    size: number,
  ) {
    const [views, total] = await this.viewRepo.findAndCount({
      where: { targetId: contentId, targetType: contentType },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: views,
      page,
      size,
      total,
    };
  }

  async findStoryViews(storyIds: number[]) {
    const userId = this.context.getUserId();

    this.logger.debug(`findStoryViews: userId=${userId}, storyIds=${storyIds}`);

    const views = await this.viewRepo.find({
      where: {
        targetId: In(storyIds),
        userId,
        targetType: ContentServiceType.STORY,
      },
    });

    this.logger.debug(`views found: ${JSON.stringify(views)}`);

    const viewedIds = new Set(views.map((v) => v.targetId));

    const result = storyIds.map((id) => ({
      storyId: id,
      isViewed: viewedIds.has(id),
    }));

    this.logger.debug(`result: ${JSON.stringify(result)}`);

    return result;
  }
}
