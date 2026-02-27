import { Test, TestingModule } from '@nestjs/testing';
import { FollowEdgeController } from './follow_edge.controller';
import { FollowEdgeService } from './follow_edge.service';

describe('FollowEdgeController', () => {
  let controller: FollowEdgeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowEdgeController],
      providers: [FollowEdgeService],
    }).compile();

    controller = module.get<FollowEdgeController>(FollowEdgeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
