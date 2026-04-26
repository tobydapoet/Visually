import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationType } from 'src/enum/notification.type';
import {
  CommentPayloadEvent,
  ContentPayloadEvent,
  FollowPayloadEvent,
  LikePayloadEvent,
} from './dto/payload-content.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ContentType } from 'src/enum/content.type';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectQueue('notification-queue')
    private readonly notificationQueue: Queue,
  ) {}

  @Get()
  async findAll(@Query('page') page?: number, @Query('size') size?: number) {
    return await this.notificationService.findAll(
      page ? Number(page) : 1,
      size ? Number(size) : 20,
    );
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async readAll() {
    return await this.notificationService.readAll();
  }

  @EventPattern('content.notification.created')
  async handleCreateContent(@Payload() event: ContentPayloadEvent) {
    console.log('EVENT: ', event);
    const jobs = event.followerIds.map((userId) => ({
      name: 'notification-queue',
      data: {
        userId,
        authorId: event.senderId,
        username: event.username,
        snapshotUrl: event.avatarUrl,
        type: NotificationType.CREATE,
        contentType: event.contentType,
        contentId: event.contentId,
      },
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }));

    await this.notificationQueue.addBulk(jobs);
  }

  @EventPattern('content.commented')
  async handleCreateComment(@Payload() event: CommentPayloadEvent) {
    await this.notificationService.create({
      contentId: event.contentId,
      type: NotificationType.COMMENT,
      userId: event.rootUserId,
      username: event.username,
      contentType: event.contentType,
      snapshotUrl: event.avatarUrl,
    });

    if (event.receiverId) {
      await this.notificationService.create({
        contentId: event.contentId,
        type: NotificationType.COMMENT,
        userId: event.receiverId,
        username: event.username,
        contentType: ContentType.COMMENT,
        snapshotUrl: event.avatarUrl,
      });
    }
  }

  @EventPattern('content.liked')
  async handleCreateLike(@Payload() event: LikePayloadEvent) {
    await this.notificationService.create({
      contentId: event.contentId,
      type: NotificationType.LIKE,
      userId: event.receiverId,
      username: event.username,
      contentType: event.contentType,
      snapshotUrl: event.avatarUrl,
    });
  }

  @EventPattern('follow.notification.created')
  async handleFollow(@Payload() event: FollowPayloadEvent) {
    await this.notificationService.create({
      type: NotificationType.FOLLOW,
      userId: event.followedId,
      username: event.followerUsername,
      snapshotUrl: event.followerAvatarUrl,
    });
  }
}
