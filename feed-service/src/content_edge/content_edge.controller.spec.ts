import { Test, TestingModule } from '@nestjs/testing';
import { ContentEdgeController } from './content_edge.controller';
import { ContentEdgeService } from './content_edge.service';

describe('ContentEdgeController', () => {
  let controller: ContentEdgeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentEdgeController],
      providers: [ContentEdgeService],
    }).compile();

    controller = module.get<ContentEdgeController>(ContentEdgeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
