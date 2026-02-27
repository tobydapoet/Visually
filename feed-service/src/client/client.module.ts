import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EurekaService } from './euruka.service';
import { AdClient } from './ad.client';

@Module({
  imports: [HttpModule],
  providers: [EurekaService, AdClient],
  exports: [EurekaService, AdClient],
})
export class ClientModule {}
