import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedSource } from 'src/enums/FeedSource';
import { DeleteContentJobData } from './dto/job-feed.dto';
import { FeedBackfillEvent, FeedBatchEvent } from './dto/FeedBatchEvent';
import { ContentClient } from 'src/client/content.client';
import Redis from 'ioredis';

@Processor('fanout')
export class FanoutProcessor extends WorkerHost {
  private readonly logger = new Logger(FanoutProcessor.name);
  private readonly BATCH_SIZE = 500;

  constructor(
    private readonly feedService: FeedService,
    private contentClient: ContentClient,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'fanout-post':
        await this.handleFanoutPost(job.data as FeedBatchEvent);
        break;

      case 'fanout-activity':
        await this.handleFanoutActivity(job.data as FeedBatchEvent);
        break;

      case 'fanout-backfill':
        await this.handleFanoutBackfill(job.data as FeedBackfillEvent);
        break;

      case 'fanout-celebrity':
        await this.handleFanoutCelebrity(job.data as FeedBatchEvent);
        break;

      case 'fanout-deleted':
        await this.handleFanoutDelete(job.data as FeedBackfillEvent);
        break;

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleFanoutPost(data: FeedBatchEvent): Promise<void> {
    const {
      followerIds,
      contentId,
      contentType,
      timestamp,
      likeCount,
      commentCount,
      saveCount,
    } = data;
    if (!followerIds.length) return;

    const score = this.feedService.calculateScore(
      FeedSource.FOLLOW,
      Date.parse(timestamp),
      likeCount,
      commentCount,
      saveCount,
    );

    for (let i = 0; i < followerIds.length; i += this.BATCH_SIZE) {
      const batch = followerIds.slice(i, i + this.BATCH_SIZE);
      await this.feedService.create(
        batch.map((userId) => ({
          userId,
          contentId,
          contentType,
          score,
          source: FeedSource.FOLLOW,
        })),
      );
    }
  }

  private async handleFanoutActivity(data: FeedBatchEvent): Promise<void> {
    const {
      followerIds,
      contentId,
      contentType,
      timestamp,
      likeCount,
      commentCount,
      saveCount,
    } = data;
    if (!followerIds.length) return;

    const score = this.feedService.calculateScore(
      FeedSource.ACTIVITY,
      Date.parse(timestamp),
      likeCount,
      commentCount,
      saveCount,
    );

    for (let i = 0; i < followerIds.length; i += this.BATCH_SIZE) {
      const batch = followerIds.slice(i, i + this.BATCH_SIZE);
      await this.feedService.create(
        batch.map((userId) => ({
          userId,
          contentId,
          contentType,
          score,
          source: FeedSource.ACTIVITY,
        })),
      );
    }
  }

  async handleFanoutCelebrity(data: FeedBatchEvent): Promise<void> {
    const {
      followerIds,
      contentId,
      contentType,
      timestamp,
      likeCount,
      commentCount,
      saveCount,
    } = data;
    if (!followerIds.length) return;

    const score = this.feedService.calculateScore(
      FeedSource.CELEBRITY,
      Date.parse(timestamp),
      likeCount,
      commentCount,
      saveCount,
    );

    const pipeline = this.redis.pipeline();
    for (const followerId of followerIds) {
      const key = `celebrity:feed:${followerId}`;
      pipeline.zadd(key, score, JSON.stringify({ contentId, contentType }));
      pipeline.expire(key, 60 * 60 * 24 * 7);
    }
    await pipeline.exec();
  }

  async handleFanoutBackfill(data: FeedBackfillEvent): Promise<void> {
    const { followerId, userId } = data;
    const contents = await this.contentClient.getRecentByUserId(userId);

    console.log('contents : ', contents);

    if (!contents.length) return;

    await this.feedService.create(
      contents.map((c) => ({
        userId: followerId,
        contentId: c.contentId,
        contentType: c.contentType,
        score: this.feedService.calculateScore(
          FeedSource.FOLLOW,
          new Date(c.createdAt).getTime(),
          0,
          0,
          0,
        ),
        source: FeedSource.FOLLOW,
      })),
    );
  }

  async handleFanoutDelete(data: FeedBackfillEvent): Promise<void> {
    const { followerId, userId } = data;

    const contents = await this.contentClient.getRecentByUserId(userId);

    await this.feedService.delete(
      contents.map((content) => {
        return {
          contentId: content.contentId,
          type: content.contentType,
          followerId,
        };
      }),
    );
  }
}
