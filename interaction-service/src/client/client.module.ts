import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { UserClient } from './user.client';
import { EurekaService } from './euruka.service';
import { ContentClient } from './content.client';

@Module({
  imports: [HttpModule],
  providers: [UserClient, EurekaService, ContentClient],
  exports: [UserClient, EurekaService, ContentClient],
})
export class ClientModule {}
