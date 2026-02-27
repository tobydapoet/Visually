import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationJob } from './dto/job-notification.dto';
import { FollowClient } from 'src/client/follow.client';
import { NotificationService } from './notification.service';

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private readonly followClient: FollowClient,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<NotificationJob>) {
    const { type, userId, snapshotUrl, username, contentType, contentId } =
      job.data;

    const size = 500;
    let page = 0;

    while (true) {
      let response;

      try {
        response = await this.followClient.getFollowers(userId, page, size);
      } catch (error) {
        console.error('Follow service error:', error);
        break;
      }

      const followers = response?.content ?? [];

      if (!followers.length) break;

      const followerIds = followers.map((f) => f.followerId);

      await this.notificationService.createBulk({
        contentId,
        type,
        userId: followerIds,
        username,
        contentType,
        snapshotUrl,
      });

      if (followers.length < size) break;

      page++;
    }
  }
}
