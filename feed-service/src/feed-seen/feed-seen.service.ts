import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { ContentType } from 'src/enums/ContentType';
import { Feed } from 'src/feed/entities/feed.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FeedSeenService {
  private readonly logger = new Logger(FeedSeenService.name);

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

    this.logger.log(
      `📌 markReelsSeen: userId=${userId}, key=${key}, watchTime=${watchTime}s`,
    );

    if (watchTime >= 3) {
      const seenKey = `reels:seen:${userId}`;
      await this.redis.sadd(seenKey, key);
      await this.redis.expire(seenKey, TTL);
      this.logger.log(`✅ Added to SEEN: ${seenKey} → ${key}`);
    } else {
      const skippedKey = `reels:skipped:${userId}`;
      await this.redis.sadd(skippedKey, key);
      await this.redis.expire(skippedKey, TTL);

      const count = await this.redis.scard(skippedKey);
      this.logger.log(
        `⏭ Added to SKIPPED: ${skippedKey} → ${key} (total: ${count})`,
      );

      if (count > 15) {
        const members = await this.redis.smembers(skippedKey);
        await this.redis.srem(skippedKey, members[0]);
        this.logger.log(`🗑 Removed oldest skipped: ${members[0]}`);
      }
    }
  }
}
