import { Injectable, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/notification/entities/notification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CleanupService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  @Cron('0 3 * * *')
  async removeGlobalOldNotifications() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('createdAt < :date', { date: thirtyDaysAgo })
      .execute();
  }
}
