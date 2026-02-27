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
        return `${username} liked your ${String(contentType!)}.`;

      case NotificationType.COMMENT:
        if (contentType === ContentType.COMMENT) {
          return `${username} replied to your comment.`;
        }
        return `${username} commented on your ${String(contentType!)}.`;

      case NotificationType.CREATE:
        return `${username} created a new ${String(contentType!)}.`;

      default:
        return `You have a new notification.`;
    }
  }

  async createBulk(dto: CreateMultipleNotificationDto) {
    const content = this.buildContent(dto.username, dto.type, dto.contentType);

    const values = dto.userId.map((receiverId) => ({
      userId: receiverId,
      snapshotUrl: dto.snapshotUrl ?? undefined,
      type: dto.type,
      content,
    }));

    await this.notificationRepo
      .createQueryBuilder()
      .insert()
      .into(Notification)
      .values(values)
      .execute();

    for (const receiverId of dto.userId) {
      this.kafkaClient.emit('notification.created', {
        key: receiverId.toString(),
        value: {
          userId: receiverId,
          type: dto.type,
          content,
          snapshotUrl: dto.snapshotUrl,
          contentId: dto.contentId,
          contentType: dto.contentType,
          createdAt: new Date(),
        },
      });
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
      data: notifications,
      meta: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
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
