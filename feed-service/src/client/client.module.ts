import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EurekaService } from './euruka.service';
import { AdClient } from './ad.client';
import { ContentClient } from './content.client';
import { Userclient } from './user.client';
import { GeminiClient } from './gemini.client';

@Module({
  imports: [HttpModule],
  providers: [EurekaService, AdClient, ContentClient, Userclient, GeminiClient],
  exports: [EurekaService, AdClient, ContentClient, Userclient, GeminiClient],
})
export class ClientModule {}
