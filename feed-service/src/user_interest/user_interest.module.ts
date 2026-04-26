import { Module } from '@nestjs/common';
import { UserInterestService } from './user_interest.service';
import { ClientModule } from 'src/client/client.module';
import { UserInterest } from './entities/user_interest.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInterestConsumer } from './user_interest.consumer';
import { ContextModule } from 'src/context/context.module';
import Redis from 'ioredis';
import { FeedSeenModule } from 'src/feed-seen/feed-seen.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInterest]),
    ClientModule,
    ContextModule,
    FeedSeenModule,
  ],
  controllers: [UserInterestConsumer],
  providers: [
    UserInterestService,
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
  exports: [UserInterestService],
})
export class UserInterestModule {}
