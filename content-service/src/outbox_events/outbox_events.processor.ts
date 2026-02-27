import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OutboxEventsService } from './outbox_events.service';

@Injectable()
export class OutboxEventsProcessor {
  constructor(private readonly outboxEventsService: OutboxEventsService) {}

  @Interval(2000)
  async handle() {
    await this.outboxEventsService.run();
  }
}
