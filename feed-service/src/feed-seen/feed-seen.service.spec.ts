import { Test, TestingModule } from '@nestjs/testing';
import { FeedSeenService } from './feed-seen.service';

describe('FeedSeenService', () => {
  let service: FeedSeenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedSeenService],
    }).compile();

    service = module.get<FeedSeenService>(FeedSeenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
