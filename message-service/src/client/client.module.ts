import { Module } from '@nestjs/common';
import { UserClient } from './user.client';
import { HttpModule } from '@nestjs/axios';
import { ContentClient } from './content.client';
import { MediaClient } from './media.client';
import { EurekaService } from './euruka.service';

@Module({
  imports: [HttpModule],
  providers: [UserClient, ContentClient, MediaClient, EurekaService],
  exports: [UserClient, ContentClient, MediaClient, EurekaService],
})
export class ClientModule {}
