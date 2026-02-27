import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feed } from './entities/feed.entity';
import { BullModule } from '@nestjs/bullmq';
import { FollowEdgeModule } from 'src/follow_edge/follow_edge.module';
import { ContentEdgeModule } from 'src/content_edge/content_edge.module';
import { ClientModule } from 'src/client/client.module';
import 'dotenv/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feed]),
    FollowEdgeModule,
    ContentEdgeModule,
    ClientModule,

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
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
