import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { In, Repository } from 'typeorm';
import { ContentServiceType, LikeTargetType } from 'src/enums/ContentType';
import { ContextService } from 'src/context/context.service';
import { CommentService } from 'src/comment/comment.service';
import { InteractionType } from 'src/enums/InteractionType';
import { ContentClient } from 'src/client/content.client';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { DataSource } from 'typeorm';
import { likeToContentTypeMap } from './maps/likeToContentTypeMap';
import { ContentCacheService } from 'src/content-cache/content-cache.service';
import { UserRole } from 'src/enums/user_role.type';

@Injectable({ scope: Scope.REQUEST })
export class LikeService {
  constructor(
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    private context: ContextService,
    private commentService: CommentService,
    private contentClient: ContentClient,
    private outboxEventService: OutboxEventsService,
    private dataSource: DataSource,
    private contentCacheService: ContentCacheService,
  ) {}

  async create(createLikeDto: CreateLikeDto) {
    const currentUserId = this.context.getUserId();
    const currentUserAvatarUrl = this.context.getAvatarUrl();
    const currentUsername = this.context.getUsername();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    const existingLike = await this.likeRepo.findOne({
      where: {
        userId: currentUserId,
        targetId: createLikeDto.targetId,
        targetType: createLikeDto.targetType,
      },
    });
    if (existingLike) return { liked: true };

    if (createLikeDto.targetType === LikeTargetType.COMMENT) {
      const comment = await this.commentService.findById(
        createLikeDto.targetId,
      );
      if (!comment) throw new NotFoundException("Can't find this content");
    } else {
      const contentType = likeToContentTypeMap[createLikeDto.targetType];
      if (!contentType) throw new BadRequestException('Invalid target type');
      const isValid = await this.contentCacheService.verifyContentWithCache(
        createLikeDto.targetId,
        contentType,
      );
      if (!isValid) throw new NotFoundException('Content not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedLike: Like;

    try {
      savedLike = await queryRunner.manager.save(Like, {
        userId: currentUserId,
        username: currentUsername,
        avatarUrl: currentUserAvatarUrl,
        targetId: createLikeDto.targetId,
        targetType: createLikeDto.targetType,
      });

      const content = await this.resolveContentId(createLikeDto);

      if (!content) {
        throw new Error('Content not found');
      }

      await this.outboxEventService.emitLike(queryRunner.manager, {
        eventType: 'content.liked',
        payload: {
          contentId: savedLike.targetId,
          senderId: currentUserId,
          contentType: createLikeDto.targetType,
          username: currentUsername,
          avatarUrl: currentUserAvatarUrl,
          likeId: savedLike.id,
          receiverId: content.userId,
          timestamp: new Date().toISOString(),
          likeCount: content.likeCount,
          commentCount: content.commentCount,
          saveCount: content.saveCount,
          tags: content.tags,
          caption: content.caption,
        },
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return { liked: true };
  }

  private async resolveContentId(dto: CreateLikeDto): Promise<
    | {
        userId: string;
        likeCount: number;
        commentCount?: number;
        saveCount?: number;
        caption?: string;
        tags?: {
          id: number;
          name: string;
        }[];
      }
    | undefined
  > {
    switch (dto.targetType) {
      case LikeTargetType.POST:
        const postRes = await this.contentClient.getPost(dto.targetId);
        return {
          commentCount: postRes.commentCount,
          likeCount: postRes.likeCount,
          userId: postRes.userId,
          saveCount: postRes.saveCount,
          tags: postRes.tags,
          caption: postRes.caption,
        };

      case LikeTargetType.SHORT:
        const shortRes = await this.contentClient.getShort(dto.targetId);
        return {
          commentCount: shortRes.commentCount,
          likeCount: shortRes.likeCount,
          userId: shortRes.userId,
          saveCount: shortRes.saveCount,
          tags: shortRes.tags,
          caption: shortRes.caption,
        };

      case LikeTargetType.STORY:
        const storyRes = await this.contentClient.getStory(dto.targetId);
        return {
          userId: storyRes.userId,
          likeCount: storyRes.likeCount,
        };

      case LikeTargetType.COMMENT: {
        const comment = await this.commentService.findOne(dto.targetId);
        if (!comment) return undefined;

        await this.commentService.updateInteraction(
          dto.targetId,
          InteractionType.LIKE,
        );
        return {
          userId: comment.userId,
          likeCount: comment.likeCount,
        };
      }

      default:
        return undefined;
    }
  }

  async updateUserDetail(userId: string, avatarUrl: string, username: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const likes = await this.likeRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!likes.length) break;

      await this.likeRepo.update(
        { id: In(likes.map((p) => p.id)) },
        { avatarUrl, username },
      );

      skip += BATCH_SIZE;
    }
  }

  async findByTarget(
    targetId: number,
    type: LikeTargetType,
    page = 1,
    size = 10,
  ) {
    const [likes, total] = await this.likeRepo.findAndCount({
      where: {
        targetId,
        targetType: type,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: likes,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async remove(targetId: number, targetType: LikeTargetType) {
    const userId = this.context.getUserId();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    const existLike = await this.likeRepo.findOne({
      where: { targetId, targetType, userId },
    });

    if (!existLike) {
      throw new NotFoundException('Like not found!');
    }

    if (existLike.targetType === LikeTargetType.COMMENT) {
      await this.commentService.updateInteraction(
        existLike.targetId,
        InteractionType.UNLIKE,
      );
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await this.outboxEventService.emitDislike(queryRunner.manager, {
          eventType: 'content.disliked',
          payload: {
            contentId: existLike.targetId,
            contentType: existLike.targetType,
            userId: userId,
            timestamp: new Date().toISOString(),
          },
        });

        await queryRunner.manager.delete(Like, { id: existLike.id });

        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }

      return;
    }

    await this.likeRepo.delete({ id: existLike.id });
  }

  async removeByTargetIds(targetIds: number[], type: LikeTargetType) {
    if (!targetIds.length) return;

    await this.likeRepo.delete({
      targetId: In(targetIds),
      targetType: type,
    });
  }

  async getLikedIds(
    userId: string,
    targetIds: number[],
    targetType: LikeTargetType,
  ) {
    const likes = await this.likeRepo.find({
      where: { userId, targetId: In(targetIds), targetType },
      select: ['targetId'],
    });
    return likes.map((l) => l.targetId);
  }
}
