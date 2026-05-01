import { Inject, Injectable } from '@nestjs/common';
import {
  ContentInteractionEvent,
  ContentViewEvent,
} from './dto/event-content_interaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInterest } from './entities/user_interest.entity';
import { Repository } from 'typeorm';
import { GeminiClient } from 'src/client/gemini.client';
import Redis from 'ioredis';
import { FeedSeenService } from 'src/feed-seen/feed-seen.service';
import { ContentClient } from 'src/client/content.client';

@Injectable()
export class UserInterestService {
  constructor(
    @InjectRepository(UserInterest)
    private interestRepo: Repository<UserInterest>,
    private geminiClient: GeminiClient,
    private feedSeenModule: FeedSeenService,
    private contentClient: ContentClient,
    @Inject('REDIS_INTEREST_CLIENT') private readonly redis: Redis,
  ) {}

  async trackInterest(event: ContentInteractionEvent, score: number) {
    const tagSet = new Set<string>();

    if (event.tags && event.tags.length > 0) {
      event.tags.forEach((t) => tagSet.add(t.name));

      const extractedFromTags = await this.geminiClient.extractTopics(
        undefined,
        event.tags.map((t) => t.name),
      );
      extractedFromTags.forEach((t) => tagSet.add(t));
      console.log('BOT_TAG_TAGS: ', extractedFromTags);
    }

    if (event.caption) {
      const extractedFromCaption = await this.geminiClient.extractTopics(
        event.caption,
        event.tags?.map((t) => t.name),
      );
      extractedFromCaption.forEach((t) => tagSet.add(t));
      console.log('BOT_TAG_CAPTION: ', extractedFromCaption);
    }

    if (!tagSet.size) return;

    for (const tagName of tagSet) {
      await this.interestRepo.query(
        `
          INSERT INTO user_interests (userId, tagName, score)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE score = score + ?
        `,
        [event.senderId, tagName, score, score],
      );
    }

    if (score >= 1) {
      await this.redis.del(`user:interests:${event.senderId}`);
    }
  }

  async handleView(data: ContentViewEvent) {
    await Promise.all([
      this.trackInterest(data, 0.1),
      this.feedSeenModule.markSeen(
        data.senderId,
        data.contentId,
        data.contentType,
        data.watchTime,
      ),
      this.feedSeenModule.markReelsSeen(
        data.senderId,
        data.contentId,
        data.contentType,
        data.watchTime,
      ),
    ]);
  }

  async getTopInterests(userId: string): Promise<string[]> {
    const cacheKey = `user:interests:${userId}`;
    console.log('🔑 cacheKey:', cacheKey);

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed.length > 0) {
        console.log('⚡ Cache hit:', parsed);
        return parsed;
      }

      console.log('🫙 Cache exists but empty, querying DB...');
    }

    console.log('❌ Cache miss');

    const interests = await this.interestRepo.find({
      where: { userId },
      order: { score: 'DESC' },
      take: 40,
    });

    console.log('📦 DB interests:', interests);

    let tagNames = interests.map((i) => i.tagName);

    console.log('🏷️ Top tagNames:', tagNames);

    if (tagNames.length < 30) {
      const trending = await this.contentClient.getTrendingTags();
      tagNames = [...new Set([...tagNames, ...trending])];
    }

    const uniqueTagNames = [...new Set(tagNames)];

    await this.redis.set(
      cacheKey,
      JSON.stringify(uniqueTagNames),
      'EX',
      60 * 60,
    );

    console.log('✅ Saved interests to Redis (TTL: 1h)');

    return uniqueTagNames;
  }
}
