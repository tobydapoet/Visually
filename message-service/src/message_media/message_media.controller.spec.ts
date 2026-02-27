import { Test, TestingModule } from '@nestjs/testing';
import { MessageMediaController } from './message_media.controller';
import { MessageMediaService } from './message_media.service';

describe('MessageMediaController', () => {
  let controller: MessageMediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageMediaController],
      providers: [MessageMediaService],
    }).compile();

    controller = module.get<MessageMediaController>(MessageMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
