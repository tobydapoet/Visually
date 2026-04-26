import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationJob } from './dto/job-notification.dto';
import { NotificationService } from './notification.service';

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotificationJob>) {
    const data = job.data;

    try {
      await this.notificationService.create({
        userId: data.userId,
        username: data.username,
        snapshotUrl: data.snapshotUrl,
        type: data.type,
        contentType: data.contentType,
        contentId: data.contentId,
      });
    } catch (error: any) {
      console.error('Error stack:', error.stack);
    }
  }
}
