import { Module } from '@nestjs/common';
import { MediaClient } from './media.client';
import { HttpModule } from '@nestjs/axios';
import { EurekaService } from './euruka.service';
import { UserClient } from './user.client';
import { InteractionClient } from './interaction.client';
import { FeedClient } from './feed.client';
import { FollowClient } from './follow.client';

@Module({
  imports: [HttpModule],
  providers: [
    MediaClient,
    EurekaService,
    UserClient,
    InteractionClient,
    FeedClient,
    FollowClient,
  ],
  exports: [
    MediaClient,
    EurekaService,
    UserClient,
    InteractionClient,
    FeedClient,
    FollowClient,
  ],
})
export class ClientModule {}
