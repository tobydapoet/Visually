import { Test, TestingModule } from '@nestjs/testing';
import { StoryStorageController } from './story_storage.controller';
import { StoryStorageService } from './story_storage.service';

describe('StoryStorageController', () => {
  let controller: StoryStorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoryStorageController],
      providers: [StoryStorageService],
    }).compile();

    controller = module.get<StoryStorageController>(StoryStorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
