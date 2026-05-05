import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { In, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { CommentTargetType, LikeTargetType } from 'src/enums/ContentType';
import { InteractionType } from 'src/enums/InteractionType';
import { ClientKafka } from '@nestjs/microservices';
import { ContentClient } from 'src/client/content.client';
import { UserDto } from 'src/client/dto/user-response.dto';
import { MentionService } from 'src/mention/mention.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Like } from 'src/like/entities/like.entity';
import { DataSource } from 'typeorm';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { UserRole } from 'src/enums/user_role.type';

@Injectable({ scope: Scope.REQUEST })
export class CommentService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepo: Repository<Like>,
    private context: ContextService,
    private contentClient: ContentClient,
    private mentionService: MentionService,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
    private outboxEventService: OutboxEventsService,
    private dataSource: DataSource,
  ) {}

  async updateUserDetail(userId: string, avatarUrl: string, username: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const comments = await this.commentRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!comments.length) break;

      await this.commentRepo.update(
        { id: In(comments.map((p) => p.id)) },
        { avatarUrl, username },
      );

      skip += BATCH_SIZE;
    }
  }

  async create(createCommentDto: CreateCommentDto) {
    const userId = this.context.getUserId();
    const username = this.context.getUsername();
    const avatarUrl = this.context.getAvatarUrl();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    const content =
      createCommentDto.targetType === CommentTargetType.POST
        ? await this.contentClient.getPost(createCommentDto.targetId)
        : await this.contentClient.getShort(createCommentDto.targetId);

    if (!content) throw new NotFoundException('Content not found');

    let repliedUser: UserDto | null = null;
    if (createCommentDto.replyToId) {
      const repliedComment = await this.commentRepo.findOne({
        where: { id: createCommentDto.replyToId },
      });

      if (!repliedComment) {
        throw new NotFoundException('Reply comment not found');
      }

      if (repliedComment.userId !== userId) {
        repliedUser = {
          userId: repliedComment.userId,
          username: repliedComment.username,
          avatarUrl: repliedComment.avatarUrl,
        };
      }
    }

    const receiverMap = new Map<
      string,
      { username: string; avatarUrl?: string }
    >();

    if (content && content.userId !== userId) {
      receiverMap.set(content.userId, {
        username: content.username,
        avatarUrl: content.avatarUrl,
      });
    }

    if (repliedUser && !receiverMap.has(repliedUser.userId)) {
      receiverMap.set(repliedUser.userId, {
        username: repliedUser.username,
        avatarUrl: repliedUser.avatarUrl ?? undefined,
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedComment: Comment;

    try {
      savedComment = await queryRunner.manager.save(Comment, {
        userId,
        username,
        avatarUrl,
        targetId: createCommentDto.targetId,
        targetType: createCommentDto.targetType,
        content: createCommentDto.content,
        ...(createCommentDto.replyToId && {
          replyTo: { id: createCommentDto.replyToId },
        }),
      });

      await this.outboxEventService.emitComment(queryRunner.manager, {
        eventType: 'content.commented',
        payload: {
          senderId: userId,
          username,
          avatarUrl,
          rootUserId: content?.userId,
          contentId: savedComment.targetId,
          contentType: savedComment.targetType,
          commentId: savedComment.id,
          timestamp: new Date().toISOString(),
          receiverId: savedComment.replyTo?.userId,
          likeCount: content.likeCount,
          commentCount: content.commentCount,
          saveCount: content.saveCount,
          tags: content.tags,
          caption: content.caption,
        },
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    if (createCommentDto.replyToId) {
      const repliedComment = await this.commentRepo.findOne({
        where: { id: createCommentDto.replyToId },
      });

      if (!repliedComment) {
        throw new NotFoundException('Reply comment not found');
      }

      if (
        repliedComment.targetId !== createCommentDto.targetId ||
        repliedComment.targetType !== createCommentDto.targetType
      ) {
        throw new BadRequestException(
          'Reply comment must belong to the same target',
        );
      }
      await this.updateInteraction(
        createCommentDto.replyToId,
        InteractionType.COMMENT,
      );
    }

    if (createCommentDto.mentions) {
      await this.mentionService.createMany({
        mentions: createCommentDto.mentions,
        commentId: savedComment.id,
      });
    }

    if (receiverMap.size > 0) {
      this.kafkaClient.emit('content.notification.commented', {
        receiverIds: Array.from(receiverMap.keys()),
        usernames: Array.from(receiverMap.values()).map((v) => v.username),
        snapshotAvatarUrls: Array.from(receiverMap.values()).map(
          (v) => v.avatarUrl,
        ),
        actorName: savedComment.username,
        actorAvatarUrl: savedComment.avatarUrl,
        contentId: savedComment.targetId,
        contentType: savedComment.targetType,
        commentId: savedComment.id,
      });
    }

    return savedComment;
  }

  async findByTarget(
    targetId: number,
    type: CommentTargetType,
    page = 1,
    size = 10,
  ) {
    const userId = this.context.getUserId();
    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.mentions', 'mentions')
      .where('comment.targetId = :targetId', { targetId })
      .andWhere('comment.targetType = :type', { type })
      .andWhere('comment.replyTo IS NULL');

    if (userId) {
      qb.addSelect(
        `CASE WHEN comment.userId = :userId THEN 0 ELSE 1 END`,
        'user_priority',
      )
        .setParameter('userId', userId)
        .orderBy('user_priority', 'ASC')
        .addOrderBy('comment.createdAt', 'DESC');
    } else {
      qb.orderBy('comment.createdAt', 'DESC');
    }

    const [comments, total] = await qb
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    let likedCommentIds = new Set<number>();
    if (userId) {
      const likes = await this.likeRepo.find({
        where: {
          targetId: In(comments.map((c) => c.id)),
          targetType: LikeTargetType.COMMENT,
          userId,
        },
      });
      likedCommentIds = new Set(likes.map((l) => l.targetId));
    }

    return {
      content: comments.map((c) => ({
        ...c,
        isLiked: likedCommentIds.has(c.id),
      })),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(commentId: number) {
    const res = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!res) {
      throw new NotFoundException("Can't find this comment");
    }
    return res.id;
  }

  async findReplies(commentId: number, page = 1, size = 10) {
    const userId = this.context.getUserId();

    const [replies, total] = await this.commentRepo.findAndCount({
      where: { replyTo: { id: commentId } },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * size,
      take: size,
      relations: ['replies', 'mentions'],
    });

    let likedCommentIds = new Set<number>();
    if (userId) {
      const likes = await this.likeRepo.find({
        where: {
          targetId: In(replies.map((r) => r.id)),
          targetType: LikeTargetType.COMMENT,
          userId,
        },
      });
      likedCommentIds = new Set(likes.map((l) => l.targetId));
    }

    return {
      content: replies.map((r) => ({
        ...r,
        isLiked: likedCommentIds.has(r.id),
      })),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  async updateInteraction(commentId: number, action: InteractionType) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException(`comment not found!`);
    }
    switch (action) {
      case InteractionType.COMMENT:
        comment.replyCount += 1;
        break;
      case InteractionType.LIKE:
        comment.likeCount += 1;
        break;

      case InteractionType.DELETE_COMMENT:
        if (comment.replyCount > 0) {
          comment.replyCount -= 1;
        }
        break;
      case InteractionType.UNLIKE:
        if (comment.likeCount > 0) {
          comment.likeCount -= 1;
        }
        break;
      default:
        break;
    }
    await this.commentRepo.save(comment);
  }

  async update(id: number, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment not found!`);
    }
    const now = new Date();
    const createdAt = new Date(comment.createdAt);

    const diffMs = now.getTime() - createdAt.getTime();

    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    if (diffMs > FIFTEEN_MINUTES) {
      throw new ForbiddenException('Exceeded the allowed time!');
    }

    await this.commentRepo.update(id, { content: updateCommentDto.content });

    if (updateCommentDto.mentions !== undefined) {
      await this.mentionService.updateMentions(id, updateCommentDto.mentions);
    }

    return this.commentRepo.findOne({ where: { id }, relations: ['mentions'] });
  }

  async findOne(id: number) {
    return this.commentRepo.findOne({ where: { id } });
  }

  async remove(commentId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    try {
      const rootComment = await queryRunner.manager.findOne(Comment, {
        where: { id: commentId },
      });

      if (!rootComment) {
        throw new NotFoundException('Comment not found');
      }

      const allIds: number[] = [];
      const stack = [commentId];

      while (stack.length) {
        const currentId = stack.pop()!;
        allIds.push(currentId);

        const children = await queryRunner.manager.find(Comment, {
          where: { replyTo: { id: currentId } },
          select: ['id'],
        });

        for (const child of children) {
          stack.push(child.id);
        }
      }

      await this.mentionService.updateMentions(commentId);

      this.kafkaClient.emit('comment.likes.remove', {
        targetIds: allIds,
        targetType: LikeTargetType.COMMENT,
      });

      await this.outboxEventService.emitDeleteComment(queryRunner.manager, {
        eventType: 'content.comment_deleted',
        payload: {
          contentId: rootComment.targetId,
          contentType: rootComment.targetType,
          deletedCount: allIds.length,
          timestamp: new Date().toISOString(),
        },
      });

      await queryRunner.manager.delete(Comment, allIds);

      await queryRunner.commitTransaction();

      return { deleted: allIds.length };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getCommentedIds(
    userId: string,
    targetIds: number[],
    targetType: CommentTargetType,
  ) {
    const comments = await this.commentRepo.find({
      where: { userId, targetId: In(targetIds), targetType },
      select: ['targetId'],
    });
    return comments.map((c) => c.targetId);
  }
}
