import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { In, IsNull, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { CommentTargetType, LikeTargetType } from 'src/enums/ContentType';
import { InteractionType } from 'src/enums/InteractionType';
import { ClientKafka } from '@nestjs/microservices';
import { ContentClient } from 'src/client/content.client';
import { UserDto } from 'src/client/dto/user-response.dto';
import { MentionService } from 'src/mention/mention.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Like } from 'src/like/entities/like.entity';

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
  ) {}

  async updateAvatarUrl(userId: string, avatarUrl: string) {
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
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  async create(createCommentDto: CreateCommentDto) {
    const userId = this.context.getUserId();

    const comment = this.commentRepo.create({
      userId,
      username: this.context.getUsername(),
      avatarUrl: this.context.getAvatarUrl(),
      targetId: createCommentDto.targetId,
      targetType: createCommentDto.targetType,
      content: createCommentDto.content,
      ...(createCommentDto.replyToId && {
        replyTo: { id: createCommentDto.replyToId },
      }),
    });

    const savedComment = await this.commentRepo.save(comment);

    if (createCommentDto.replyToId) {
      await this.updateInteraction(
        createCommentDto.replyToId,
        InteractionType.COMMENT,
      );
    }

    if (comment && createCommentDto.mentions) {
      await this.mentionService.createMany({
        mentions: createCommentDto.mentions,
        commentId: comment.id,
      });
    }

    const owner =
      savedComment.targetType === CommentTargetType.POST
        ? await this.contentClient.getPostOwner(savedComment.targetId)
        : await this.contentClient.getShortOwner(savedComment.targetId);

    let repliedUser: UserDto | null = null;
    if (createCommentDto.replyToId) {
      const repliedComment = await this.commentRepo.findOne({
        where: { id: createCommentDto.replyToId },
      });
      if (repliedComment && repliedComment.userId !== userId) {
        repliedUser = {
          userId: repliedComment.userId,
          username: repliedComment.username,
          avatarUrl: repliedComment.avatarUrl,
        };
      }
    }

    this.kafkaClient.emit('content.commented', {
      contentId: savedComment.targetId,
      contentType: savedComment.targetType,
      commentId: savedComment.id,
      authorId: userId,
      timestamp: new Date().toISOString(),
      userId: savedComment.userId,
      avatarUrl: savedComment.avatarUrl,
    });

    const receiverMap = new Map<
      string,
      { username: string; avatarUrl?: string }
    >();

    if (owner && owner.userId !== userId) {
      receiverMap.set(owner.userId, {
        username: owner.username,
        avatarUrl: owner.avatarUrl,
      });
    }

    if (repliedUser && !receiverMap.has(repliedUser.userId)) {
      receiverMap.set(repliedUser.userId, {
        username: repliedUser.username,
        avatarUrl: repliedUser.avatarUrl || undefined,
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
    const [comments, total] = await this.commentRepo.findAndCount({
      where: {
        targetId,
        targetType: type,
        replyTo: IsNull(),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
      relations: ['mentions'],
    });

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
        isLiked: likedCommentIds.has(c.id), // ✅
      })),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
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
        isLiked: likedCommentIds.has(r.id), // ✅
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
    const rootComment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!rootComment) throw new NotFoundException('Comment not found');

    const allIds: number[] = [];
    const stack = [commentId];

    while (stack.length) {
      const currentId = stack.pop()!; 
      allIds.push(currentId);

      const children = await this.commentRepo.find({
        where: { replyTo: { id: currentId } },
        select: ['id'],
        relations: ['replies'],
      });

      for (const child of children) stack.push(child.id);
    }

    await this.mentionService.updateMentions(commentId);

    this.kafkaClient.emit('comment.likes.remove', {
      targetIds: allIds,
      targetType: LikeTargetType.COMMENT,
    });
    await this.commentRepo.delete(allIds);

    this.kafkaClient.emit('content.comment_deleted', {
      contentId: rootComment.targetId,
      contentType: rootComment.targetType,
      deletedCount: allIds.length,
      timestamp: new Date().toISOString(),
    });

    return { deleted: allIds.length };
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
