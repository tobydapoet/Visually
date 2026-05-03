import { Module } from '@nestjs/common';
import { ContentCacheService } from './content-cache.service';
import Redis from 'ioredis';
import { ContextModule } from 'src/context/context.module';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [ContextModule, ClientModule],
  providers: [
    ContentCacheService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          db: Number(process.env.REDIS_DB_INTERACTION),
        }),
    },
  ],
  exports: [ContentCacheService],
})
export class ContentCacheModule {}
