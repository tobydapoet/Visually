import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { ContextModule } from 'src/context/context.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientModule } from 'src/client/client.module';
import { BullModule } from '@nestjs/bullmq';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ContextModule,
    ClientModule,
    ClientModule,
    KafkaModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
