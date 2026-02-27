import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { NotificationModule } from 'src/notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
  imports: [NotificationModule, TypeOrmModule.forFeature([Notification])],
  providers: [CleanupService],
})
export class CleanupModule {}
