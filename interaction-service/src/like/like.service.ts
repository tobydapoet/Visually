import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { In, Repository } from 'typeorm';
import { ContetServiceType, LikeTargetType } from 'src/enums/ContentType';
import { ContextService } from 'src/context/context.service';
import { ClientKafka } from '@nestjs/microservices';
import { CommentService } from 'src/comment/comment.service';
import { InteractionType } from 'src/enums/InteractionType';
import { ContentClient } from 'src/client/content.client';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    private context: ContextService,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
    private commentService: CommentService,
    private contentClient: ContentClient,
  ) {}
  async create(createLikeDto: CreateLikeDto) {
    const currentUserId = this.context.getUserId();
    const currentUserAvatarUrl = this.context.getAvatarUrl();
    const currentUsername = this.context.getUsername();

    const newLike = this.likeRepo.create({
      userId: currentUserId,
      username: currentUsername,
      avatarUrl: currentUserAvatarUrl,
      targetId: createLikeDto.targetId,
      targetType: createLikeDto.targetType,
    });

    const savedLike = await this.likeRepo.save(newLike);

    let ownerId: string | undefined;

    if (
      createLikeDto.targetType === LikeTargetType.POST ||
      createLikeDto.targetType === LikeTargetType.SHORT
    ) {
      const owner =
        createLikeDto.targetType === LikeTargetType.POST
          ? await this.contentClient.getPostOwner(createLikeDto.targetId)
          : await this.contentClient.getShortOwner(createLikeDto.targetId);

      ownerId = owner?.userId;

      if (ownerId) {
        this.kafkaClient.emit(`content.liked`, {
          contentId: createLikeDto.targetId,
          contentType: createLikeDto.targetType,
          userId: currentUserId,
          authorId: ownerId,
          likeId: savedLike.id,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (createLikeDto.targetType === LikeTargetType.COMMENT) {
      const existingComment = await this.commentService.findOne(
        createLikeDto.targetId,
      );

      if (!existingComment) return savedLike;

      ownerId = existingComment.userId;

      await this.commentService.updateInteraction(
        createLikeDto.targetId,
        InteractionType.LIKE,
      );
    }

    if (ownerId && ownerId !== currentUserId) {
      this.kafkaClient.emit(`content.notification.liked`, {
        contentId: createLikeDto.targetId,
        contentType: createLikeDto.targetType,
        actorName: currentUsername,
        actorAvatarUrl: currentUserAvatarUrl,
        receiverId: ownerId,
        likeId: savedLike.id,
        timestamp: new Date().toISOString(),
      });
    }

    return savedLike;
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
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
        { avatarUrl },
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

  async remove(id: number) {
    const userId = this.context.getUserId();
    const existLike = await this.likeRepo.findOne({ where: { id } });
    if (existLike?.userId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to do this action",
      );
    }
    if (!existLike) {
      throw new NotFoundException('Like not found!');
    }
    if (existLike.targetType === LikeTargetType.COMMENT) {
      this.commentService.updateInteraction(
        existLike.targetId,
        InteractionType.UNLIKE,
      );
    } else {
      const eventName = `${existLike.targetType.toLowerCase()}.unliked`;
      this.kafkaClient.emit(eventName, {
        [`${existLike.targetType.toLowerCase()}Id`]: existLike.targetId,
        userId: this.context.getUserId(),
      });
    }
    return this.likeRepo.delete(id);
  }

  async removeByTargetIds(targetIds: number[], type: LikeTargetType) {
    if (!targetIds.length) return;

    await this.likeRepo.delete({
      targetId: In(targetIds),
      targetType: type,
    });
  }
}
