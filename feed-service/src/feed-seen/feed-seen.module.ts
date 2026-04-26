import { Module } from '@nestjs/common';
import { FeedSeenService } from './feed-seen.service';
import Redis from 'ioredis';
import { Feed } from 'src/feed/entities/feed.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Feed])],
  providers: [
    FeedSeenService,
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
  exports: [FeedSeenService],
})
export class FeedSeenModule {}
