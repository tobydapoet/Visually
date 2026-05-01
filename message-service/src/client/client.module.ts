import { Module } from '@nestjs/common';
import { UserClient } from './user.client';
import { HttpModule } from '@nestjs/axios';
import { MediaClient } from './media.client';
import { EurekaService } from './euruka.service';
import { FollowClient } from './follow.client';
import { GeminiClient } from './gemini.client';

@Module({
  imports: [HttpModule],
  providers: [
    UserClient,
    MediaClient,
    EurekaService,
    FollowClient,
    GeminiClient,
  ],
  exports: [UserClient, MediaClient, EurekaService, FollowClient, GeminiClient],
})
export class ClientModule {}
