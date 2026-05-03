import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateShortDto } from './dto/create-short.dto';
import { UpdateShortDto } from './dto/update-short.dto';
import { Short } from './entities/short.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TagService } from 'src/tag/tag.service';
import { MediaClient } from 'src/client/media.client';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { UserRole } from 'src/enums/user_role.type';
import { ContentStatus } from 'src/enums/content_status.type';
import { ContentServiceType, ContentType } from 'src/enums/content.type';

import { ShortResponsePageDto } from './dto/response-page-short';
import { ContextService } from 'src/context/context.service';
import { InteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { Tag } from 'src/tag/entities/tag.entity';
import { MentionsService } from 'src/mention/mention.service';
import { InteractionClient } from 'src/client/interaction.client';
import { MentionResponse } from 'src/mention/dto/response-mentions.dto';
import {
  ContentManagePageReponse,
  DefaultReponseDto,
} from 'src/repost/dto/respose-default.dto';
import { Repost } from 'src/repost/entities/repost.entity';
import { ShortResponseDto } from './dto/response-short.dto';

@Injectable()
export class ShortService {
  private logger = new Logger(ShortService.name);

  constructor(
    @InjectRepository(Short)
    private readonly shortRepo: Repository<Short>,
    @InjectRepository(Repost)
    private readonly repostRepo: Repository<Repost>,
    private readonly mediaClient: MediaClient,
    private context: ContextService,
    private tagService: TagService,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
    private mentionService: MentionsService,
    private interactionClient: InteractionClient,
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

    const allowedVideoMimeTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];
    if (!allowedVideoMimeTypes.includes(fileVideo.mimetype)) {
      throw new BadRequestException(
        'Invalid file type! Video must be a valid video file (mp4, mpeg, mov, avi, webm).',
      );
    }

    const allowedImageMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedImageMimeTypes.includes(fileThumbnail.mimetype)) {
      throw new BadRequestException(
        'Invalid file type! Thumbnail must be a valid image file (jpeg, png, gif, webp).',
      );
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
      const shortData: Partial<Short> = {
        userId,
        username,
        avatarUrl,
        caption: createShortDto.caption,
        mediaId: mediaResponses[0].id,
        mediaUrl: mediaResponses[0].url,
        thumbnailId: mediaResponses[1].id,
        thumbnailUrl: mediaResponses[1].url,
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

      if (createShortDto.mentions) {
        await this.mentionService.createMany(
          userId,
          createShortDto.mentions.map((m) => ({
            ...m,
            targetId: savedShort.id,
            type: ContentType.SHORT,
          })),
        );
      }

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: savedShort.id,
          senderId: savedShort.userId,
          username,
          contentType: 'SHORT',
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

  async countUserShort(userId: string) {
    return this.shortRepo.count({ where: { userId } });
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
      case InteractionType.SAVE:
        short.saveCount += 1;
        break;
      case InteractionType.DISLIKE:
        if (short.likeCount > 0) {
          short.likeCount -= 1;
        }
        break;
      case InteractionType.UNSAVE:
        if (short.saveCount > 0) {
          short.saveCount -= 1;
        }
        break;
      case InteractionType.REPOST:
        short.repostCount += 1;
        break;
      case InteractionType.UNREPOST:
        if (short.repostCount > 0) {
          short.repostCount -= 1;
        }

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

  async getByStatus(
    status: ContentStatus,
    page = 1,
    size = 10,
    keyword?: string,
  ): Promise<ContentManagePageReponse> {
    const whereCondition = keyword
      ? [
          { status, username: ILike(`%${keyword}%`) },
          { status, caption: ILike(`%${keyword}%`) },
        ]
      : { status };

    const [shorts, total] = await this.shortRepo.findAndCount({
      where: whereCondition,
      skip: (page - 1) * size,
      take: size,
      order: {
        createdAt: 'DESC',
      },
    });

    const mentions = await this.mentionService.findManyByTargetIds(
      shorts.map((short) => short.id),
      ContentType.SHORT,
    );

    const mentionMap = new Map<number, MentionResponse[]>();

    mentions.forEach((m) => {
      if (!mentionMap.has(m.targetId)) {
        mentionMap.set(m.targetId, []);
      }
      mentionMap.get(m.targetId)!.push(m);
    });

    return {
      content: shorts.map((short) => {
        return {
          id: short.id,
          userId: short.userId,
          avatarUrl: short.avatarUrl,
          username: short.username,
          caption: short.caption,
          thumbnailUrl: short.thumbnailUrl,
          createdAt: short.createdAt,
          updatedAt: short.updatedAt,
          mentions: (mentionMap.get(short.id) || []).map((m) => ({
            userId: m.userId,
            username: m.username,
          })),
        };
      }),
      total,
      page,
      size,
    };
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

      const role = this.context.getRole();
      const userId = this.context.getUserId();

      const isAdmin = role === UserRole.ADMIN;
      const isModerator = role === UserRole.MODERATOR;
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

  async findManyByIds(ids: number[]): Promise<DefaultReponseDto[]> {
    const userId = this.context.getUserId();

    const [shorts, allTags, allMentions, reposts] = await Promise.all([
      this.shortRepo.find({ where: { id: In(ids) } }),
      this.tagService.findByTargetIds(ids, ContentType.SHORT),
      this.mentionService.findManyByTargetIds(ids, ContentType.SHORT),
      this.repostRepo.find({
        where: {
          userId,
          originalId: In(ids),
          originalType: ContentType.SHORT,
        },
      }),
    ]);

    const interactions = await this.interactionClient.getCurrentInteraction(
      userId,
      shorts.map((short) => short.id),
      ContentServiceType.SHORT,
    );

    const interactionMap = new Map<number, (typeof interactions)[0]>();
    interactions.forEach((i) => interactionMap.set(i.targetId, i));

    const tagsMap = new Map<number, Tag[]>();
    allTags.forEach((tag) => {
      if (!tagsMap.has(tag.targetId)) tagsMap.set(tag.targetId, []);
      tagsMap.get(tag.targetId)!.push(tag);
    });

    const mentionsMap = new Map<number, MentionResponse[]>();
    allMentions.forEach((mention) => {
      if (!mentionsMap.has(mention.targetId))
        mentionsMap.set(mention.targetId, []);
      mentionsMap.get(mention.targetId)!.push(mention);
    });

    const repostedIds = new Set(reposts.map((r) => r.originalId));

    return shorts.map((short) => {
      const interaction = interactionMap.get(short.id);
      return {
        id: short.id,
        caption: short.caption,
        userId: short.userId,
        username: short.username,
        avatarUrl: short.avatarUrl,
        thumbnailUrl: short.thumbnailUrl,
        mediaUrl: short.mediaUrl,
        likeCount: short.likeCount,
        commentCount: short.commentCount,
        saveCount: short.saveCount,
        repostCount: short.repostCount,
        createdAt: short.createdAt,
        tags: tagsMap.get(short.id) ?? [],
        mentions: mentionsMap.get(short.id) ?? [],
        isLiked: interaction?.isLiked ?? false,
        isCommented: interaction?.isCommented ?? false,
        isSaved: interaction?.isSaved ?? false,
        isReposted: repostedIds.has(short.id),
      };
    });
  }

  async findByUser(
    userId: string,
    page = 1,
    size = 10,
  ): Promise<ShortResponsePageDto> {
    const currentUserId = this.context.getUserId();

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
        'saveCount',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    const interactions = await this.interactionClient.getCurrentInteraction(
      currentUserId,
      shorts.map((short) => short.id),
      ContentServiceType.SHORT,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return {
      content: shorts.map((short) => {
        const interaction = interactionMap.get(short.id);

        return {
          id: short.id,
          caption: short.caption,
          thumbnailUrl: short.thumbnailUrl,
          userId: short.userId,
          avatarUrl: short.avatarUrl,
          username: short.username,
          likeCount: short.likeCount,
          commentCount: short.commentCount,
          saveCount: short.saveCount,
          isLiked: interaction?.isLiked ?? false,
          isCommented: interaction?.isCommented ?? false,
          isSaved: interaction?.isSaved ?? false,
        };
      }),
      page,
      size,
      total,
    };
  }

  async findOneWithUrl(shortId: number): Promise<ShortResponseDto> {
    const userId = this.context.getUserId();

    const [short, tags, interaction, mentions, repost] = await Promise.all([
      this.shortRepo.findOne({ where: { id: shortId } }),
      this.tagService.findByTargetId(shortId, ContentType.SHORT),
      this.interactionClient.getCurrentInteraction(
        userId,
        [shortId],
        ContentServiceType.SHORT,
      ),
      this.mentionService.findMany(shortId, ContentType.SHORT),
      this.repostRepo.findOne({
        where: { userId, originalId: shortId, originalType: ContentType.SHORT },
      }),
    ]);

    if (!short) throw new NotFoundException(`Short not found!`);

    return {
      id: shortId,
      userId: short.userId,
      username: short.username,
      avatarUrl: short.avatarUrl,
      caption: short.caption,
      mediaUrl: short.mediaUrl,
      commentCount: short.commentCount,
      likeCount: short.likeCount,
      repostCount: short.repostCount,
      saveCount: short.saveCount,
      createdAt: short.createdAt,
      thumbnailUrl: short.thumbnailUrl,
      tags,
      mentions,
      isLiked: interaction[0]?.isLiked ?? false,
      isCommented: interaction[0]?.isCommented ?? false,
      isSaved: interaction[0]?.isSaved ?? false,
      isReposted: !!repost,
      status: short.status,
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

      if (updateShortDto.mentionAdd && updateShortDto.mentionAdd.length > 0) {
        await this.mentionService.createMany(
          userId,
          updateShortDto.mentionAdd.map((m) => ({
            ...m,
            targetId: shortId,
            type: ContentType.SHORT,
          })),
        );
      }

      if (
        updateShortDto.mentionIdRemove &&
        updateShortDto.mentionIdRemove.length > 0
      ) {
        await this.mentionService.deleteMany(updateShortDto.mentionIdRemove);
      }

      const savedShort = await queryRunner.manager.save(currentShort);

      if (updateShortDto.caption) {
        await this.outboxEventService.create(queryRunner.manager, {
          eventType: 'content.updated',
          payload: {
            contentId: savedShort.id,
            senderId: savedShort.userId,
            contentType: 'SHORT',
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
    const userId = this.context.getUserId();
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
        'short.saveCount',
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

    const interactions = await this.interactionClient.getCurrentInteraction(
      userId,
      shorts.map((short) => short.id),
      ContentServiceType.SHORT,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    const content = shorts.map((short) => {
      const interaction = interactionMap.get(short.id);

      return {
        id: short.id,
        userId: short.userId,
        username: short.username,
        avatarUrl: short.avatarUrl,
        caption: short.caption,
        thumbnailUrl: short.thumbnailUrl,
        likeCount: short.likeCount,
        commentCount: short.commentCount,
        saveCount: short.saveCount,
        isLiked: interaction?.isLiked ?? false,
        isCommented: interaction?.isCommented ?? false,
        isSaved: interaction?.isSaved ?? false,
      };
    });

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
          contentType: 'SHORT',
        },
      });

      await this.outboxEventService.delete(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: short.id,
          contentType: 'SHORT',
          timestamp: new Date().toISOString(),
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
