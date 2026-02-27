import { Module } from '@nestjs/common';
import { FeedRecommendService } from './feed-recommend.service';
import { FeedRecommendController } from './feed-recommend.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedRecommendation } from './entities/feed-recommend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeedRecommendation])],
  controllers: [FeedRecommendController],
  providers: [FeedRecommendService],
})
export class FeedRecommendModule {}
