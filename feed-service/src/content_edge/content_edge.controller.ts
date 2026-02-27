import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { ContentEdgeService } from './content_edge.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  InteractionContentType,
  InteractionType,
} from 'src/enums/interaction.type';
import { ContentType } from 'src/enums/ContentType';
import { ContentCreateEventDto } from './dto/event-content_edge.dto';
import { ContentStatus } from 'src/enums/ContentStatus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ActivityJobData,
  DeleteContentJobData,
  PostContentJobData,
} from 'src/feed/dto/job-feed.dto';
import { FeedSource } from 'src/enums/FeedSource';

@Controller('content-edge')
export class ContentEdgeController {
  constructor(
    private readonly contentEdgeService: ContentEdgeService,
    @InjectQueue('fanout') private readonly fanoutQueue: Queue,
  ) {}

  private readonly logger = new Logger(ContentEdgeController.name);

  @EventPattern('content.created')
  async handleContentCreated(@Payload() event: any): Promise<void> {
    this.logger.log(
      `Received content.created: ${event.contentId} by ${event.authorId}`,
    );

    if (event.type?.toUpperCase() === 'SHORT') {
      return;
    }
    const jobData: PostContentJobData = {
      contentId: event.contentId,
      authorId: event.authorId,
      type: event.type,
      createdAt: event.createdAt,
    };
    await this.contentEdgeService.create({
      contentId: event.contentId,
      authorId: event.authorId,
      contentType: event.type,
    });

    await this.fanoutQueue.add('fanout-post', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.logger.log('Fanout post job queued');
  }

  @EventPattern('content.deleted')
  async handleContentDeleted(
    @Payload() event: { contentId: number; type: ContentType },
  ): Promise<void> {
    if (event.type === ContentType.STORY) {
      return;
    }

    this.logger.log(`Received content.deleted: ${event.contentId}`);

    const jobData: DeleteContentJobData = {
      contentId: event.contentId,
      type: event.type,
    };

    await this.contentEdgeService.updateStatus(
      event.contentId,
      event.type,
      ContentStatus.DELETED,
    );

    await this.fanoutQueue.add('fanout-delete', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.logger.log('Fanout delete job queued');
  }

  @EventPattern('content.liked')
  async handleContentLiked(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content liked:', data);

    await this.contentEdgeService.updateInteraction(
      data.contentId,
      data.contentType,
      InteractionType.LIKE,
    );
  }

  @EventPattern('content.status.updated')
  async handleUpdateContentStatus(
    @Payload()
    data: {
      contentId: number;
      status: ContentStatus;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Status data:', data);

    await this.contentEdgeService.updateStatus(
      data.contentId,
      data.contentType,
      data.status,
    );
  }

  @EventPattern('content.unliked')
  async handleContentUnliked(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content unliked:', data);

    await this.contentEdgeService.updateInteraction(
      data.contentId,
      data.contentType,
      InteractionType.UNLIKE,
    );
  }

  @EventPattern('content.commented')
  async handleContentCommented(
    @Payload()
    data: {
      userId: string;
      contentId: number;
      commentId: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content commented:', data);

    await this.contentEdgeService.updateInteraction(
      data.contentId,
      data.contentType,
      InteractionType.COMMENT,
    );

    const jobData: ActivityJobData = {
      actorId: data.userId,
      contentId: data.contentId,
      contentType: data.contentType,
      activityType: InteractionContentType.COMMENT,
      source: FeedSource.ACTIVITY,
    };

    await this.fanoutQueue.add('fanout-activity', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  @EventPattern('content.comment_deleted')
  async handleContentCommentDeleted(
    @Payload()
    data: {
      contentId: number;
      num: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content comment deleted:', data);

    await this.contentEdgeService.decreaseCommentInteraction(
      data.contentId,
      data.contentType,
      data.num,
    );
  }

  @EventPattern('content.shared')
  async handleContentShared(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content shared:', data);

    await this.contentEdgeService.updateInteraction(
      data.contentId,
      data.contentType,
      InteractionType.SHARE,
    );

    const jobData: ActivityJobData = {
      actorId: data.userId,
      contentId: data.contentId,
      contentType: data.contentType,
      activityType: InteractionContentType.SHARE,
      source: FeedSource.ACTIVITY,
    };

    await this.fanoutQueue.add('fanout-activity', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  @EventPattern('content.unshared')
  async handleContentUnshared(
    @Payload()
    data: {
      contentId: number;
      shareId: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content unshared:', data);

    await this.contentEdgeService.updateInteraction(
      data.contentId,
      data.contentType,
      InteractionType.UNSHARE,
    );
  }

  @EventPattern('content.created')
  async create(@Payload() event: ContentCreateEventDto) {
    return this.contentEdgeService.create({
      authorId: event.authorId,
      contentId: event.contentId,
      contentType: event.type,
    });
  }
}
