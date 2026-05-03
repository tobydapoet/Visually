import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feed } from './entities/feed.entity';
import { BullModule } from '@nestjs/bullmq';
import { ClientModule } from 'src/client/client.module';
import 'dotenv/config';
import { FanoutProcessor } from './fanout.prcessor';
import { FeedConsumer } from './feed.consumer';
import Redis from 'ioredis';
import { ContextModule } from 'src/context/context.module';
import { UserInterestModule } from 'src/user_interest/user_interest.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feed]),
    ClientModule,
    UserInterestModule,
    ContextModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        db: Number(process.env.REDIS_DB_FEED),
      },
    }),

    BullModule.registerQueue({
      name: 'fanout',
    }),
  ],
  controllers: [FeedController, FeedConsumer],
  providers: [
    FeedService,
    FanoutProcessor,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          db: Number(process.env.REDIS_DB_CELEBRITY),
        }),
    },
    {
      provide: 'REDIS_INTEREST_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          db: Number(process.env.REDIS_DB_INTEREST),
        }),
    },
  ],
  exports: [FeedService],
})
export class FeedModule {}
