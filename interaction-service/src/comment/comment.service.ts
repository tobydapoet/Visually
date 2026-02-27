import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { In, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import {
  CommentTargetType,
  ContetServiceType,
  LikeTargetType,
} from 'src/enums/ContentType';
import { LikeService } from 'src/like/like.service';
import { InteractionType } from 'src/enums/InteractionType';
import { ClientKafka } from '@nestjs/microservices';
import { ContentClient } from 'src/client/content.client';
import { UserDto } from 'src/client/dto/user-response.dto';
import { CommentSummary } from './dto/summary-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    private context: ContextService,
    @Inject(forwardRef(() => LikeService))
    private likeService: LikeService,
    private contentClient: ContentClient,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}

  private async traverseToRoot(commentId: number): Promise<CommentSummary> {
    let current = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!current) {
      throw new NotFoundException(`Comment #${commentId} not found`);
    }

    const visited = new Set<number>();

    while (current.targetType === CommentTargetType.COMMENT) {
      if (visited.has(current.id)) {
        throw new Error('Circular comment reference detected');
      }

      visited.add(current.id);

      const parent = await this.commentRepo.findOne({
        where: { id: current.targetId },
      });

      if (!parent) {
        throw new NotFoundException('Root target not found');
      }

      current = parent;
    }

    return {
      id: commentId,
      userId: current.userId,
      username: current.username,
      avatarUrl: current.avatarUrl,
      targetId: current.targetId,
      targetType: current.targetType,
    };
  }

  // private async findRootTarget(
  //   targetId: number,
  //   targetType: CommentTargetType,
  // ): Promise<CommentSummary> {
  //   // if (targetType === CommentTargetType.POST) {
  //   //   return { id: targetId, type: 'POST' };
  //   // }
  //   // if (targetType === CommentTargetType.SHORT) {
  //   //   return { id: targetId, type: 'SHORT' };
  //   // }
  //   if (targetType === CommentTargetType.COMMENT) {
  //     return this.traverseToRoot(targetId);
  //   }
  //   else {
  //     return this
  //   }

  //   throw new Error(`Unknown target type: ${targetType}`);
  // }

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

    const newComment = this.commentRepo.create({
      userId,
      username: this.context.getUsername(),
      avatarUrl: this.context.getAvatarUrl(),
      targetId: createCommentDto.targetId,
      targetType: createCommentDto.targetType,
      content: createCommentDto.content,
    });

    const savedComment = await this.commentRepo.save(newComment);

    let contentId: number;
    let contentType: CommentTargetType;
    let owner: UserDto | null = null;
    let repliedUser: UserDto | null = null;

    if (
      savedComment.targetType === CommentTargetType.POST ||
      savedComment.targetType === CommentTargetType.SHORT
    ) {
      contentId = savedComment.targetId;
      contentType = savedComment.targetType;

      owner =
        contentType === CommentTargetType.POST
          ? await this.contentClient.getPostOwner(contentId)
          : await this.contentClient.getShortOwner(contentId);
    } else if (savedComment.targetType === CommentTargetType.COMMENT) {
      const root = await this.traverseToRoot(savedComment.targetId);

      contentId = root.targetId;
      contentType = root.targetType;

      if (contentType === CommentTargetType.POST) {
        owner = await this.contentClient.getPostOwner(contentId);
      } else if (contentType === CommentTargetType.SHORT) {
        owner = await this.contentClient.getShortOwner(contentId);
      }

      const repliedComment = await this.commentRepo.findOne({
        where: { id: savedComment.targetId },
      });

      if (repliedComment && repliedComment.userId !== userId) {
        repliedUser = {
          userId: repliedComment.userId,
          username: repliedComment.username,
          avatarUrl: repliedComment.avatarUrl,
        };
      }
    } else {
      throw new Error('Unsupported CommentTargetType');
    }

    if (contentType !== CommentTargetType.COMMENT) {
      this.kafkaClient.emit('content.commented', {
        contentId,
        contentType,
        commentId: savedComment.id,
        authorId: userId,
        timestamp: new Date().toISOString(),
        userId: savedComment.userId,
        avatarUrl: savedComment.avatarUrl,
      });
    }

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

    if (
      repliedUser &&
      repliedUser.userId !== userId &&
      !receiverMap.has(repliedUser.userId)
    ) {
      receiverMap.set(repliedUser.userId, {
        username: repliedUser.username,
        avatarUrl: repliedUser.avatarUrl || undefined,
      });
    }

    const receiverIds = Array.from(receiverMap.keys());
    const usernames = Array.from(receiverMap.values()).map((v) => v.username);
    const snapshotAvatarUrls = Array.from(receiverMap.values()).map(
      (v) => v.avatarUrl,
    );

    if (receiverIds.length > 0) {
      this.kafkaClient.emit('content.notification.commented', {
        receiverIds,
        usernames,
        snapshotAvatarUrls,
        actorName: savedComment.username,
        actorAvatarUrl: savedComment.avatarUrl,
        contentId,
        contentType,
        commentId: savedComment.id,
      });
    }

    return savedComment;
  }

  async findByTarget(
    targetId: number,
    type: CommentTargetType,
    page: number,
    size: number,
  ) {
    const [comments, total] = await this.commentRepo.findAndCount({
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
      content: comments,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
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
        comment.commentCount += 1;
        break;
      case InteractionType.LIKE:
        comment.likeCount += 1;
        break;

      case InteractionType.DELETE_COMMENT:
        if (comment.commentCount > 0) {
          comment.commentCount -= 1;
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
  async update(id: number, content: string) {
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
    comment.content = content;
    return this.commentRepo.save(comment);
  }

  async findOne(id: number) {
    return this.commentRepo.findOne({ where: { id } });
  }

  async remove(commentId: number) {
    const rootComment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!rootComment) {
      throw new NotFoundException('Comment not found');
    }

    let contentId: number;
    let contentType: CommentTargetType;

    if (
      rootComment.targetType === CommentTargetType.POST ||
      rootComment.targetType === CommentTargetType.SHORT
    ) {
      contentId = rootComment.targetId;
      contentType = rootComment.targetType;
    } else {
      const root = await this.traverseToRoot(commentId);
      contentId = root.targetId;
      contentType = root.targetType;
    }

    const allIds: number[] = [];
    const stack = [commentId];

    while (stack.length) {
      const currentId = stack.pop()!;

      allIds.push(currentId);

      const children = await this.commentRepo.find({
        where: {
          targetId: currentId,
          targetType: CommentTargetType.COMMENT,
        },
        select: ['id'],
      });

      for (const child of children) {
        stack.push(child.id);
      }
    }

    await this.likeService.removeByTargetIds(allIds, LikeTargetType.COMMENT);

    await this.commentRepo.delete(allIds);

    this.kafkaClient.emit('content.comment_deleted', {
      contentId,
      contentType,
      deletedCount: allIds.length,
      timestamp: new Date().toISOString(),
    });

    return { deleted: allIds.length };
  }
}
