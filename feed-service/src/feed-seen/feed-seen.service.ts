import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { ContentType } from 'src/enums/ContentType';
import { Feed } from 'src/feed/entities/feed.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FeedSeenService {
  constructor(
    @InjectRepository(Feed) private feedRepo: Repository<Feed>,
    @Inject('REDIS_INTEREST_CLIENT') private readonly redis: Redis,
  ) {}

  async markSeen(
    userId: string,
    contentId: number,
    contentType: ContentType,
    watchTime: number,
  ): Promise<void> {
    const TTL = 60 * 60 * 24;
    const key = `${contentType}:${contentId}`;

    if (watchTime >= 3) {
      await Promise.all([
        this.feedRepo.update(
          { userId, contentId, contentType },
          { isSeen: true, seenAt: new Date() },
        ),
        this.redis
          .sadd(`feed:seen:${userId}`, key)
          .then(() => this.redis.expire(`feed:seen:${userId}`, TTL)),
      ]);
    } else {
      const skippedKey = `feed:skipped:${userId}`;
      await this.redis.sadd(skippedKey, key);
      await this.redis.expire(skippedKey, TTL);
    }
  }

  async markReelsSeen(
    userId: string,
    contentId: number,
    contentType: ContentType,
    watchTime: number,
  ): Promise<void> {
    const TTL = 60 * 60 * 24;
    const key = `${contentType}:${contentId}`;

    if (watchTime >= 3) {
      const seenKey = `reels:seen:${userId}`;
      await this.redis.sadd(seenKey, key);
      await this.redis.expire(seenKey, TTL);
    } else {
      const skippedKey = `reels:skipped:${userId}`;
      await this.redis.sadd(skippedKey, key);
      await this.redis.expire(skippedKey, TTL);

      const count = await this.redis.scard(skippedKey);
      if (count > 15) {
        const members = await this.redis.smembers(skippedKey);
        await this.redis.srem(skippedKey, members[0]);
      }
    }
  }
}
