import { Test, TestingModule } from '@nestjs/testing';
import { ConversationMemberService } from './conversation_member.service';

describe('ConversationMemberService', () => {
  let service: ConversationMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationMemberService],
    }).compile();

    service = module.get<ConversationMemberService>(ConversationMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
