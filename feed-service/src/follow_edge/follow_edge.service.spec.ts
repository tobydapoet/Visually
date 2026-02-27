import { Test, TestingModule } from '@nestjs/testing';
import { FollowEdgeService } from './follow_edge.service';

describe('FollowEdgeService', () => {
  let service: FollowEdgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowEdgeService],
    }).compile();

    service = module.get<FollowEdgeService>(FollowEdgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
