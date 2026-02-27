import { Test, TestingModule } from '@nestjs/testing';
import { CollabController } from './collab.controller';
import { CollabService } from './collab.service';

describe('CollabController', () => {
  let controller: CollabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollabController],
      providers: [CollabService],
    }).compile();

    controller = module.get<CollabController>(CollabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
