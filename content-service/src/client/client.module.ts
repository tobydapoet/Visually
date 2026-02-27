import { Module } from '@nestjs/common';
import { MediaClient } from './media.client';
import { HttpModule } from '@nestjs/axios';
import { EurekaService } from './euruka.service';
import { UserClient } from './user.client';

@Module({
  imports: [HttpModule],
  providers: [MediaClient, EurekaService, UserClient],
  exports: [MediaClient, EurekaService, UserClient],
})
export class ClientModule {}
