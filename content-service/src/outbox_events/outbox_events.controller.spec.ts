import { Test, TestingModule } from '@nestjs/testing';
import { OutboxEventsController } from './outbox_events.controller';
import { OutboxEventsService } from './outbox_events.service';

describe('OutboxEventsController', () => {
  let controller: OutboxEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutboxEventsController],
      providers: [OutboxEventsService],
    }).compile();

    controller = module.get<OutboxEventsController>(OutboxEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
