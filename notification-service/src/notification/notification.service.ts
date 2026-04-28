import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { LessThan, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { NotificationType } from 'src/enum/notification.type';
import { ContentType } from 'src/enum/content.type';
import {
  CreateMultipleNotificationDto,
  CreateNotificationDto,
} from './dto/create-notification.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private context: ContextService,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}

  private buildContent(
    username: string,
    type: NotificationType,
    contentType?: ContentType,
  ): string {
    switch (type) {
      case NotificationType.FOLLOW:
        return `${username} started following you.`;

      case NotificationType.LIKE:
        return `${username} liked your ${String(contentType!).toLowerCase()}.`;

      case NotificationType.COMMENT:
        if (contentType === ContentType.COMMENT) {
          return `${username} replied to your comment.`;
        }
        return `${username} commented on your ${String(contentType!).toLowerCase()}.`;

      case NotificationType.CREATE:
        return `${username} created a new ${String(contentType!).toLowerCase()}.`;

      default:
        return `You have a new notification.`;
    }
  }

  async create(dto: CreateNotificationDto) {
    const content = this.buildContent(dto.username, dto.type, dto.contentType);
    const nofiication = this.notificationRepo.create({ ...dto, content });
    const savedNotification = await this.notificationRepo.save(nofiication);
    this.kafkaClient.emit('notification.created', {
      key: dto.userId.toString(),
      value: {
        userId: dto.userId,
        type: dto.type,
        content,
        snapshotUrl: dto.snapshotUrl,
        senderId: dto.senderId,
        contentId: dto.contentId,
        contentType: dto.contentType,
        createdAt: new Date(),
      },
    });
    return savedNotification;
  }

  async readAll() {
    const userId = this.context.getUserId();
    const notifications = await this.notificationRepo.find({
      where: { userId: userId, isRead: false },
    });
    notifications.map((notification) => {
      notification.isRead = true;
    });
    return await this.notificationRepo.save(notifications);
  }

  async findAll(page = 1, size = 20) {
    const userId = this.context.getUserId();
    const skip = (page - 1) * size;
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: {
        userId,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
    });
    return {
      content: notifications,
      total,
      page,
      size,
    };
  }

  async removeGlobalOldNotifications() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.notificationRepo.delete({
      createdAt: LessThan(thirtyDaysAgo),
    });
  }
}
