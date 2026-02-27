import { Test, TestingModule } from '@nestjs/testing';
import { ConversationMemberController } from './conversation_member.controller';
import { ConversationMemberService } from './conversation_member.service';

describe('ConversationMemberController', () => {
  let controller: ConversationMemberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationMemberController],
      providers: [ConversationMemberService],
    }).compile();

    controller = module.get<ConversationMemberController>(ConversationMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
