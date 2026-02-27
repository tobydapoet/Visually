import { Test, TestingModule } from '@nestjs/testing';
import { MessageMediaService } from './message_media.service';

describe('MessageMediaService', () => {
  let service: MessageMediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageMediaService],
    }).compile();

    service = module.get<MessageMediaService>(MessageMediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
