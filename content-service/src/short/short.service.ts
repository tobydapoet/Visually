import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateShortDto } from './dto/create-short.dto';
import { UpdateShortDto } from './dto/update-short.dto';
import { Short } from './entities/short.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CollabService } from 'src/collab/collab.service';
import { TagService } from 'src/tag/tag.service';
import { MediaClient } from 'src/client/media.client';
import { DataSource, In, Repository } from 'typeorm';
import { UserRole } from 'src/enums/user_role.type';
import { ContentStatus } from 'src/enums/content_status.type';
import { ContentType } from 'src/enums/content.type';
import { ShortResponseDto } from './dto/response-short.dto';
import { ShortResponsePageDto } from './dto/response-page-short';
import { ContextService } from 'src/context/context.service';
import { InteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { Tag } from 'src/tag/entities/tag.entity';

@Injectable()
export class ShortService {
  private logger = new Logger(ShortService.name);

  constructor(
    @InjectRepository(Short)
    private readonly shortRepo: Repository<Short>,
    private readonly mediaClient: MediaClient,
    private context: ContextService,
    private tagService: TagService,
    private collabService: CollabService,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
  ) {}

  async create(
    createShortDto: CreateShortDto,
    fileVideo: Express.Multer.File,
    fileThumbnail: Express.Multer.File,
  ): Promise<Short> {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();

    if (!fileVideo) {
      throw new BadRequestException('Video is required!');
    }

    if (!fileThumbnail) {
      throw new BadRequestException('Thumbnail is required!');
    }

    const files: Express.Multer.File[] = [fileVideo, fileThumbnail];
    const mediaResponses = await this.mediaClient.upload(
      files,
      'short',
      userId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let musicUrl: string | null = null;
      if (createShortDto.musicId) {
        const musicResponse = await this.mediaClient.getMusic(
          userId,
          createShortDto.musicId,
        );
        musicUrl = musicResponse.url;
      }

      const shortData: Partial<Short> = {
        userId,
        username,
        avatarUrl,
        caption: createShortDto.caption,
        mediaId: mediaResponses[0].id,
        mediaUrl: mediaResponses[0].url,
        thumbnailId: mediaResponses[1].id,
        thumbnailUrl: mediaResponses[1].url,
        musicId: createShortDto.musicId,
        musicUrl,
      };
      const short = this.shortRepo.create(shortData);

      const savedShort = await queryRunner.manager.save(Short, short);

      let tags: Tag[] = [];
      if (createShortDto.tagsName) {
        tags = await this.tagService.createMany({
          names: createShortDto.tagsName,
          targetId: savedShort.id,
          type: ContentType.SHORT,
        });
      }

      if (createShortDto.collabUserId) {
        await this.collabService.createMany({
          userIds: createShortDto.collabUserId,
          targetId: savedShort.id,
          type: ContentType.SHORT,
        });
      }

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: savedShort.id,
          authorId: savedShort.userId,
          username,
          type: 'SHORT',
          avatarUrl,
          createdAt: savedShort.createdAt,
          tags: tags.map((tag) => tag.name),
        },
      });

      await queryRunner.commitTransaction();

      return savedShort;
    } catch (error: any) {
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (mediaResponses?.length > 0) {
        try {
          await this.mediaClient.delete(
            userId,
            mediaResponses.map((media) => media.id),
          );
        } catch (cleanupError) {
          this.logger.error('Failed to cleanup media:', cleanupError);
        }
      }

      this.logger.error('Failed to create short:', error);

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateInteraction(shortId: number, action: InteractionType) {
    const short = await this.shortRepo.findOne({ where: { id: shortId } });
    if (!short) {
      throw new NotFoundException(`Short not found!`);
    }
    switch (action) {
      case InteractionType.COMMENT:
        short.commentCount += 1;
        break;
      case InteractionType.LIKE:
        short.likeCount += 1;
        break;
      case InteractionType.SHARE:
        short.shareCount += 1;
        break;
      case InteractionType.UNLIKE:
        if (short.likeCount > 0) {
          short.likeCount -= 1;
        }
        break;
      case InteractionType.UNSHARE:
        if (short.shareCount > 0) {
          short.shareCount -= 1;
        }
        break;
      default:
        break;
    }
    await this.shortRepo.save(short);
  }

  async decreaseCommentInteraction(shortId: number, num: number) {
    const result = await this.shortRepo.decrement(
      { id: shortId },
      'commentCount',
      num,
    );

    if (result.affected === 0) {
      throw new NotFoundException('Short not found!');
    }
  }

  async updateStatus(shortId: number, status: ContentStatus): Promise<Short> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentShort = await queryRunner.manager.findOne(Short, {
        where: { id: shortId },
      });

      if (!currentShort) {
        throw new NotFoundException(`Short not found!`);
      }

      const roles = this.context.getRoles();
      const userId = this.context.getUserId();

      const isAdmin = roles.includes(UserRole.ADMIN);
      const isModerator = roles.includes(UserRole.MODERATOR);
      const isOwner = userId === currentShort.userId;

      if (!isAdmin && !isModerator && status === ContentStatus.BANNED) {
        throw new ForbiddenException(
          "You don't have permission to do this action!",
        );
      }

      if (!isAdmin && !isModerator && !isOwner) {
        throw new UnauthorizedException(
          "You don't have permission to do this action!",
        );
      }

      currentShort.status = status;

      const savedShort = await queryRunner.manager.save(currentShort);

      await this.outboxEventService.updateStatus(queryRunner.manager, {
        eventType: 'content.status.updated',
        payload: {
          contentId: savedShort.id,
          status: savedShort.status,
          type: 'SHORT',
        },
      });

      await queryRunner.commitTransaction();

      return savedShort;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to update short status', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const shorts = await this.shortRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!shorts.length) break;

      await this.shortRepo.update(
        { id: In(shorts.map((p) => p.id)) },
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  async findByUser(
    userId: string,
    page = 1,
    size = 10,
  ): Promise<ShortResponsePageDto> {
    const [shorts, total] = await this.shortRepo.findAndCount({
      where: { userId },
      select: [
        'id',
        'caption',
        'thumbnailUrl',
        'userId',
        'username',
        'avatarUrl',
        'likeCount',
        'commentCount',
        'shareCount',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: shorts.map((short) => ({
        id: short.id,
        caption: short.caption,
        thumbnailUrl: short.thumbnailUrl,
        userId: short.userId,
        avatarUrl: short.avatarUrl,
        username: short.username,
        likeCount: short.likeCount,
        commentCount: short.commentCount,
        shareCount: short.shareCount,
      })),
      page,
      size,
      total,
    };
  }

  async findOneWithUrl(shortId: number): Promise<ShortResponseDto> {
    const short = await this.shortRepo.findOne({ where: { id: shortId } });
    if (!short) {
      throw new NotFoundException(`Short not found!`);
    }

    const tags = await this.tagService.findByTargetId(
      shortId,
      ContentType.SHORT,
    );

    return {
      id: shortId,
      userId: short.userId,
      username: short.username,
      avatarUrl: short.avatarUrl,
      caption: short.caption,
      musicUrl: short.musicUrl,
      mediaUrl: short.mediaUrl,
      commentCount: short.commentCount,
      likeCount: short.likeCount,
      sharedCount: short.shareCount,
      createdAt: short.createdAt,
      status: short.status,
      thumbnailUrl: short.thumbnailUrl,
      tags,
    };
  }

  async findOne(shortId: number): Promise<Short> {
    const short = await this.shortRepo.findOne({ where: { id: shortId } });
    if (!short) {
      throw new NotFoundException(`Short not found!`);
    }
    return short;
  }

  async update(
    shortId: number,
    updateShortDto: Partial<UpdateShortDto>,
  ): Promise<Short> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentShort = await queryRunner.manager.findOne(Short, {
        where: { id: shortId },
      });

      if (!currentShort) {
        throw new NotFoundException('Short not found');
      }

      const userId = this.context.getUserId();

      if (currentShort.userId !== userId) {
        throw new ForbiddenException(
          "You don't have permission to update this short",
        );
      }

      if (updateShortDto.caption) {
        currentShort.caption = updateShortDto.caption;
      }

      if (
        updateShortDto.tagsIdRemove &&
        updateShortDto.tagsIdRemove.length > 0
      ) {
        await this.tagService.removeMany(
          updateShortDto.tagsIdRemove,
          queryRunner.manager,
        );
      }

      if (updateShortDto.tagsNameAdd && updateShortDto.tagsNameAdd.length > 0) {
        await this.tagService.createMany(
          {
            names: updateShortDto.tagsNameAdd,
            targetId: currentShort.id,
            type: ContentType.SHORT,
          },
          queryRunner.manager,
        );
      }

      const savedShort = await queryRunner.manager.save(currentShort);

      if (updateShortDto.caption) {
        await this.outboxEventService.create(queryRunner.manager, {
          eventType: 'content.updated',
          payload: {
            contentId: savedShort.id,
            authorId: savedShort.userId,
            type: 'SHORT',
            createdAt: savedShort.createdAt,
          },
        });
      }

      await queryRunner.commitTransaction();

      return savedShort;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async search(
    keyword: string,
    page = 1,
    size = 10,
  ): Promise<ShortResponsePageDto> {
    const queryBuilder = this.shortRepo
      .createQueryBuilder('short')
      .leftJoin(
        'tags',
        'tag',
        'tag.targetId = short.id AND tag.targetType = :targetType',
        { targetType: ContentType.SHORT },
      )
      .select([
        'short.id',
        'short.userId',
        'short.username',
        'short.avatarUrl',
        'short.caption',
        'short.thumbnailUrl',
        'short.likeCount',
        'short.commentCount',
        'short.sharedCount',
      ])
      .where('short.status = :status', {
        status: ContentStatus.ACTIVE,
      });

    if (keyword) {
      queryBuilder.andWhere(
        '(short.caption ILIKE :keyword OR tag.name ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [shorts, total] = await queryBuilder
      .orderBy('short.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .distinct(true)
      .getManyAndCount();

    const content = shorts.map((short) => ({
      id: short.id,
      userId: short.userId,
      username: short.username,
      avatarUrl: short.avatarUrl,
      caption: short.caption,
      thumbnailUrl: short.thumbnailUrl,
      likeCount: short.likeCount,
      commentCount: short.commentCount,
      shareCount: short.shareCount,
    }));

    return {
      content,
      page,
      size,
      total,
    };
  }

  async delete(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const userId = this.context.getUserId();

    try {
      const short = await queryRunner.manager.findOne(Short, {
        where: { id },
      });

      if (!short) throw new NotFoundException('Short not found');

      if (short.userId !== userId) {
        throw new ForbiddenException();
      }
      await queryRunner.manager.update(
        Short,
        { id },
        { status: ContentStatus.DELETED },
      );

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.deleted',
        payload: {
          contentId: short.id,
          type: 'SHORT',
        },
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
