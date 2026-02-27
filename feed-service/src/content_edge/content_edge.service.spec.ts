import { Test, TestingModule } from '@nestjs/testing';
import { ContentEdgeService } from './content_edge.service';

describe('ContentEdgeService', () => {
  let service: ContentEdgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentEdgeService],
    }).compile();

    service = module.get<ContentEdgeService>(ContentEdgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
