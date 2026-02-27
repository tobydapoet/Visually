import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FollowEdgeService } from 'src/follow_edge/follow_edge.service';
import { FeedService } from './feed.service';
import { FeedSource } from 'src/enums/FeedSource';
import {
  PostContentJobData,
  DeleteContentJobData,
  ActivityJobData,
} from './dto/job-feed.dto';
import { ContentEdgeService } from 'src/content_edge/content_edge.service';

@Processor('fanout')
export class FanoutProcessor extends WorkerHost {
  private readonly logger = new Logger(FanoutProcessor.name);
  private readonly BATCH_SIZE = 500;

  constructor(
    private readonly followEdgeService: FollowEdgeService,
    private readonly feedService: FeedService,
    private readonly contentEdgeService: ContentEdgeService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'fanout-post':
        await this.handleFanoutPost(job.data as PostContentJobData);
        break;

      case 'fanout-activity':
        await this.handleFanoutActivity(job.data as ActivityJobData);
        break;

      case 'fanout-delete':
        await this.handleFanoutDelete(job.data as DeleteContentJobData);
        break;

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleFanoutPost(data: PostContentJobData): Promise<void> {
    const { contentId, authorId, type } = data;

    this.logger.log(
      `Fanout post: contentId=${contentId}, authorId=${authorId}, type=${type}`,
    );

    const followers = await this.followEdgeService.findByFollowedId(authorId);

    if (followers.length === 0) {
      this.logger.warn(`Author ${authorId} has no followers`);
      return;
    }

    this.logger.log(`Found ${followers.length} followers`);

    const totalBatches = Math.ceil(followers.length / this.BATCH_SIZE);

    for (let i = 0; i < followers.length; i += this.BATCH_SIZE) {
      const batch = followers.slice(i, i + this.BATCH_SIZE);
      const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

      await this.feedService.create(
        batch.map((f) => ({
          contentId,
          contentType: type,
          score: 300,
          source: FeedSource.FOLLOW,
          userId: f.followerId,
        })),
      );

      this.logger.log(
        `Batch ${currentBatch}/${totalBatches}: Created ${batch.length} feeds`,
      );
    }

    this.logger.log(
      `Fanout complete: ${followers.length} feeds created for ${contentId}`,
    );
  }

  private async handleFanoutActivity(data: ActivityJobData): Promise<void> {
    const { actorId, contentId, activityType, contentType } = data;

    if (activityType === 'LIKE') return;

    const followers = await this.followEdgeService.findByFollowedId(actorId);

    if (!followers.length) return;

    const content = await this.contentEdgeService.findOne(
      contentId,
      contentType,
    );

    if (!content) return;

    const activityBoostMap = {
      COMMENT: 100,
      SHARE: 200,
    };

    const boost = activityBoostMap[activityType] ?? 0;

    const finalScore = content.trendingScore + boost;

    for (let i = 0; i < followers.length; i += this.BATCH_SIZE) {
      const batch = followers.slice(i, i + this.BATCH_SIZE);

      await this.feedService.create(
        batch.map((f) => ({
          userId: f.followerId,
          contentId,
          contentType,
          score: finalScore,
          source: FeedSource.ACTIVITY,
        })),
      );
    }
  }

  private async handleFanoutDelete(data: DeleteContentJobData): Promise<void> {
    const { contentId, type } = data;

    this.logger.log(`Deleting feeds for content ${contentId}`);

    await this.feedService.delete(contentId, type);
  }
}
