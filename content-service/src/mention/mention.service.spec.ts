import { Test, TestingModule } from '@nestjs/testing';
import { MentionsService } from './mention.service';

describe('MentionsService', () => {
  let service: MentionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MentionsService],
    }).compile();

    service = module.get<MentionsService>(MentionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
