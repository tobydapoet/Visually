import { Module } from '@nestjs/common';
import { MediaClient } from './media.client';
import { HttpModule } from '@nestjs/axios';
import { EurekaService } from './euruka.service';
import { UserClient } from './user.client';
import { InteractionClient } from './interaction.client';

@Module({
  imports: [HttpModule],
  providers: [MediaClient, EurekaService, UserClient, InteractionClient],
  exports: [MediaClient, EurekaService, UserClient, InteractionClient],
})
export class ClientModule {}
