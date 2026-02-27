import { Test, TestingModule } from '@nestjs/testing';
import { OutboxEventsService } from './outbox_events.service';

describe('OutboxEventsService', () => {
  let service: OutboxEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxEventsService],
    }).compile();

    service = module.get<OutboxEventsService>(OutboxEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
