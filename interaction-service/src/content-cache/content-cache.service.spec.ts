import { Test, TestingModule } from '@nestjs/testing';
import { ContentCacheService } from './content-cache.service';

describe('ContentCacheService', () => {
  let service: ContentCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentCacheService],
    }).compile();

    service = module.get<ContentCacheService>(ContentCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
