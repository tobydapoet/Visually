import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FeedBackfillEvent, FeedBatchEvent } from './dto/FeedBatchEvent';

@Controller()
export class FeedConsumer {
  constructor(@InjectQueue('fanout') private readonly fanoutQueue: Queue) {}

  @EventPattern('feed.home.created')
  async handleFeedCreated(@Payload() data: FeedBatchEvent) {
    await this.fanoutQueue.add('fanout-post', data);
  }

  @EventPattern('feed.home.interacted')
  async handleFeedInteracted(@Payload() data: FeedBatchEvent) {
    await this.fanoutQueue.add('fanout-activity', data);
  }

  @EventPattern('follow.created')
  async handleFeedBackfill(@Payload() data: FeedBackfillEvent) {
    await this.fanoutQueue.add('fanout-backfill', data);
  }

  @EventPattern('feed.home.celebrity')
  async handleFeedCelebrity(@Payload() data: FeedBatchEvent) {
    await this.fanoutQueue.add('fanout-celebrity', data);
  }

  @EventPattern('follow.deleted')
  async handleUnFollow(@Payload() data: FeedBackfillEvent) {
    await this.fanoutQueue.add('fanout-deleted', data);
  }
}
