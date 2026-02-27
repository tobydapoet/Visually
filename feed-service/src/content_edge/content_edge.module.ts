import { forwardRef, Module } from '@nestjs/common';
import { ContentEdgeService } from './content_edge.service';
import { ContentEdgeController } from './content_edge.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentEdge } from './entities/content_edge.entity';
import { FeedModule } from 'src/feed/feed.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'fanout',
    }),
    TypeOrmModule.forFeature([ContentEdge]),
    forwardRef(() => FeedModule),
  ],
  controllers: [ContentEdgeController],
  providers: [ContentEdgeService],
  exports: [ContentEdgeService],
})
export class ContentEdgeModule {}
