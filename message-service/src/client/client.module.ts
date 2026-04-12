import { Module } from '@nestjs/common';
import { UserClient } from './user.client';
import { HttpModule } from '@nestjs/axios';
import { MediaClient } from './media.client';
import { EurekaService } from './euruka.service';

@Module({
  imports: [HttpModule],
  providers: [UserClient, MediaClient, EurekaService],
  exports: [UserClient, MediaClient, EurekaService],
})
export class ClientModule {}
