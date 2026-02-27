import { Test, TestingModule } from '@nestjs/testing';
import { FeedRecommendController } from './feed-recommend.controller';
import { FeedRecommendService } from './feed-recommend.service';

describe('FeedRecommendController', () => {
  let controller: FeedRecommendController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedRecommendController],
      providers: [FeedRecommendService],
    }).compile();

    controller = module.get<FeedRecommendController>(FeedRecommendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
