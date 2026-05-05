import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSaveDto } from './dto/create-save.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Save } from './entities/save.entity';
import { DataSource, In, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { ClientKafka } from '@nestjs/microservices';
import { ContentServiceType, ContentType } from 'src/enums/ContentType';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { ContentCacheService } from 'src/content-cache/content-cache.service';
import { UserRole } from 'src/enums/user_role.type';

@Injectable()
export class SaveService {
  constructor(
    @InjectRepository(Save) private saveRepo: Repository<Save>,
    private context: ContextService,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
    private contentCacheService: ContentCacheService,
  ) {}

  async create(createSaveDto: CreateSaveDto) {
    const userId = this.context.getUserId();
    const username = this.context.getUsername();
    const avatarUrl = this.context.getAvatarUrl();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    const existingSave = await this.saveRepo.findOne({
      where: {
        userId,
        targetId: createSaveDto.targetId,
        targetType: createSaveDto.targetType,
      },
    });

    if (existingSave) {
      return { saved: true };
    }

    const contentTypeMap: Record<ContentType, ContentServiceType> = {
      [ContentType.POST]: ContentServiceType.POST,
      [ContentType.SHORT]: ContentServiceType.SHORT,
    };

    const isValid = await this.contentCacheService.verifyContentWithCache(
      createSaveDto.targetId,
      contentTypeMap[createSaveDto.targetType],
    );
    if (!isValid) throw new NotFoundException('Content not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newSave = queryRunner.manager.create(Save, {
        userId,
        username,
        avatarUrl,
        targetId: createSaveDto.targetId,
        targetType: createSaveDto.targetType,
      });

      const savedSave = await queryRunner.manager.save(Save, newSave);

      await this.outboxEventService.emitSave(queryRunner.manager, {
        eventType: 'content.saved',
        payload: {
          contentId: savedSave.targetId,
          contentType: savedSave.targetType,
          userId,
        },
      });

      await queryRunner.commitTransaction();

      return { saved: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByUser(userId: string, page = 1, size = 10) {
    const [saves, total] = await this.saveRepo.findAndCount({
      where: {
        userId,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return {
      content: saves,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async updateUserDetail(userId: string, avatarUrl: string, username: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const saves = await this.saveRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!saves.length) break;

      await this.saveRepo.update(
        { id: In(saves.map((p) => p.id)) },
        { avatarUrl, username },
      );

      skip += BATCH_SIZE;
    }
  }

  async remove(targetId: number, targetType: ContentType) {
    const userId = this.context.getUserId();

    const existSave = await this.saveRepo.findOne({
      where: { targetId, targetType, userId },
    });

    if (!existSave) {
      throw new NotFoundException('Save not found!');
    }

    if (existSave.userId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to do this action",
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timestamp = new Date().toISOString();

      await this.outboxEventService.emitUnSave(queryRunner.manager, {
        eventType: 'content.unsaved',
        payload: {
          contentId: existSave.targetId,
          contentType: existSave.targetType,
          userId,
        },
      });

      await queryRunner.manager.delete(Save, { id: existSave.id });

      await queryRunner.commitTransaction();

      return { saved: false };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getSavedIds(
    userId: string,
    targetIds: number[],
    targetType: ContentType,
  ) {
    const saves = await this.saveRepo.find({
      where: { userId, targetId: In(targetIds), targetType },
      select: ['targetId'],
    });
    return saves.map((s) => s.targetId);
  }
}
