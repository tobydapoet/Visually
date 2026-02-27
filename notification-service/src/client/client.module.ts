import { Module } from '@nestjs/common';
import { FollowClient } from './follow.client';
import { EurekaService } from './euruka.service';

@Module({
  providers: [FollowClient, EurekaService],
  exports: [FollowClient],
})
export class ClientModule {}
