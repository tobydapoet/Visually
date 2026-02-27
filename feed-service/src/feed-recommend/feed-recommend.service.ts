import { Injectable } from '@nestjs/common';
import { CreateFeedRecommendDto } from './dto/create-feed-recommend.dto';
import { UpdateFeedRecommendDto } from './dto/update-feed-recommend.dto';

@Injectable()
export class FeedRecommendService {
  create(createFeedRecommendDto: CreateFeedRecommendDto) {
    return 'This action adds a new feedRecommend';
  }

  findAll() {
    return `This action returns all feedRecommend`;
  }

  findOne(id: number) {
    return `This action returns a #${id} feedRecommend`;
  }

  update(id: number, updateFeedRecommendDto: UpdateFeedRecommendDto) {
    return `This action updates a #${id} feedRecommend`;
  }

  remove(id: number) {
    return `This action removes a #${id} feedRecommend`;
  }
}
