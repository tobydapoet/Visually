import { Inject, Injectable, Logger } from '@nestjs/common';
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
  ): Promise<void> {
    const TTL = 60 * 60 * 24;
    const key = `${contentType}:${contentId}`;
    const seenKey = `feed:seen:${userId}`;

    await Promise.all([
      this.feedRepo.update(
        { userId, contentId, contentType },
        { isSeen: true, seenAt: new Date() },
      ),
      this.redis.sadd(seenKey, key).then(() => this.redis.expire(seenKey, TTL)),
    ]);
  }

  async markReelsSeen(
    userId: string,
    contentId: number,
    contentType: ContentType,
    watchTime: number,
  ): Promise<void> {
    const TTL = 60 * 60 * 24;
    const key = `${contentType}:${contentId}`;

    console.log(
      '[markReelsSeen] userId:',
      userId,
      'key:',
      key,
      'watchTime:',
      watchTime,
    );

    if (watchTime >= 3) {
      const seenKey = `reels:seen:${userId}`;
      await this.redis.sadd(seenKey, key);
      await this.redis.expire(seenKey, TTL);
      console.log('[markReelsSeen] added to seen:', seenKey);
    } else {
      const skippedKey = `reels:skipped:${userId}`;
      await this.redis.sadd(skippedKey, key);
      await this.redis.expire(skippedKey, TTL);
      console.log('[markReelsSeen] added to skipped:', skippedKey);
    }
  }
}
