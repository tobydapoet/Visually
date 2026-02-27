import { Test, TestingModule } from '@nestjs/testing';
import { StoryStorageService } from './story_storage.service';

describe('StoryStorageService', () => {
  let service: StoryStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoryStorageService],
    }).compile();

    service = module.get<StoryStorageService>(StoryStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
