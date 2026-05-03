import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ContentClient } from 'src/client/content.client';
import { ContextService } from 'src/context/context.service';
import { ContentServiceType } from 'src/enums/ContentType';

@Injectable()
export class ContentCacheService {
  private readonly logger = new Logger(ContentCacheService.name);

  constructor(
    private context: ContextService,
    private contentClient: ContentClient,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async verifyContentWithCache(
    id: number,
    type: ContentServiceType,
  ): Promise<boolean> {
    const cacheKey = `content:${type}:${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT - ${cacheKey}`);
      return cached === 'true';
    }

    this.logger.debug(`Cache MISS - ${cacheKey}`);

    const isValid = await this.contentClient.verifyTarget(
      this.context.getUserId(),
      id,
      type,
    );

    if (isValid) {
      await this.redis.set(cacheKey, 'true', 'EX', 300);
      this.logger.debug(`Cache SET - ${cacheKey}`);
    } else {
      this.logger.warn(`Content not found - ${cacheKey}`);
    }

    return isValid;
  }
}
