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
import { NotificationJob } from './dto/job-notification.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { ContentType } from 'src/enum/content.type';

@Controller('notifications')
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

  @EventPattern('content.created')
  async handleCreateContent(@Payload() event: ContentPayloadEvent) {
    const jobData: NotificationJob = {
      userId: event.authorId,
      username: event.username,
      snapshotUrl: event.avatarUrl,
      type: NotificationType.CREATE,
      contentType: event.type,
      contentId: event.contentId,
    };

    await this.notificationQueue.add('notification-queue', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  @EventPattern('content.notification.commented')
  async handleCreateComment(@Payload() event: CommentPayloadEvent) {
    if (!event.receiverIds?.length) return;

    await this.notificationService.create({
      contentId: event.contentId,
      type: NotificationType.COMMENT,
      userId: event.receiverIds[0],
      username: event.actorName,
      contentType: event.contentType,
      snapshotUrl: event.actorAvatarUrl,
    });

    if (event.receiverIds.length > 1) {
      const remainingReceiverIds = event.receiverIds.slice(1);

      await this.notificationService.createBulk({
        contentId: event.contentId,
        type: NotificationType.COMMENT,
        userId: remainingReceiverIds,
        username: event.actorName,
        snapshotUrl: event.actorAvatarUrl,
        contentType: event.contentType,
      });
    }
  }

  @EventPattern('content.notification.liked')
  async handleCreateLike(@Payload() event: LikePayloadEvent) {
    await this.notificationService.create({
      contentId: event.contentId,
      type: NotificationType.LIKE,
      userId: event.receiverId,
      username: event.actorName,
      contentType: event.contentType,
      snapshotUrl: event.actorAvatarUrl,
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
