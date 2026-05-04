import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateFeedDto } from './dto/create-feed.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Feed } from './entities/feed.entity';
import { In, LessThan, Repository } from 'typeorm';
import { ContentType } from 'src/enums/ContentType';
import { AdClient } from 'src/client/ad.client';
import { Userclient } from 'src/client/user.client';
import { FeedItemDto } from './dto/FeedBatchEvent';
import { FeedSource } from 'src/enums/FeedSource';
import Redis from 'ioredis';
import { ContextService } from 'src/context/context.service';
import { UserInterestService } from 'src/user_interest/user_interest.service';
import { ContentClient } from 'src/client/content.client';
import { DeleteContentJobData } from './dto/job-feed.dto';
import { UserRole } from 'src/enums/user_role.type';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Feed) private feedRepo: Repository<Feed>,
    private adClient: AdClient,
    private userClient: Userclient,
    private context: ContextService,
    private interestService: UserInterestService,
    private contentClient: ContentClient,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('REDIS_INTEREST_CLIENT') private readonly redisInterest: Redis,
  ) {}
  create(createFeedDtos: CreateFeedDto[]) {
    return this.feedRepo.save(createFeedDtos);
  }

  calculateScore(
    source: FeedSource,
    timestamp: number,
    likeCount: number,
    commentCount: number,
    saveCount: number,
  ): number {
    const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    const decay = Math.max(0, 1 - ageInHours / 48);

    const interactionScore = likeCount * 1 + commentCount * 2 + saveCount * 3;

    const BASE_SCORE = {
      [FeedSource.FOLLOW]: 300,
      [FeedSource.ACTIVITY]: 100,
      [FeedSource.CELEBRITY]: 50,
    };

    return (BASE_SCORE[source] + interactionScore) * decay;
  }

  async getFollowFeed(cursor?: string, take: number = 20) {
    const userId = this.context.getUserId();
    const seenKey = `feed:seen:${userId}`;
    const skippedKey = `feed:skipped:${userId}`;

    const [feeds, user, celebrityRaw, seenIds, skippedIds] = await Promise.all([
      this.feedRepo
        .createQueryBuilder('feed')
        .where('feed.userId = :userId', { userId })
        .andWhere('feed.isSeen = :isSeen', { isSeen: false })
        .andWhere(
          cursor ? 'feed.score < :cursor' : '1=1',
          cursor ? { cursor: parseFloat(cursor) } : {},
        )
        .orderBy('feed.score', 'DESC')
        .take(take + 1)
        .getMany(),
      this.userClient.getProfile(userId),
      this.redis.zrevrangebyscore(
        `celebrity:feed:${userId}`,
        cursor ? `(${cursor}` : '+inf',
        '-inf',
        'WITHSCORES',
        'LIMIT',
        0,
        take + 1,
      ),
      this.redis.smembers(seenKey),
      this.redis.smembers(skippedKey),
    ]);

    const age = user.dob
      ? new Date().getFullYear() - new Date(user.dob).getFullYear()
      : 3;

    const ads = await this.adClient.getAdFeeds(age, user.gender);

    const feedItems: FeedItemDto[] = feeds.map((f) => ({
      contentId: f.contentId,
      contentType: f.contentType,
      source: f.source,
      score: f.score,
      createdAt: f.createdAt,
    }));

    const celebrityItems: FeedItemDto[] = [];
    for (let i = 0; i < celebrityRaw.length; i += 2) {
      const { contentId, contentType } = JSON.parse(celebrityRaw[i]);
      const score = Number(celebrityRaw[i + 1]);
      celebrityItems.push({
        contentId,
        contentType,
        source: FeedSource.CELEBRITY,
        score,
        createdAt: new Date(),
      });
    }

    const adItems: FeedItemDto[] = ads.map((ad) => ({
      contentId: ad.contentId,
      contentType: ad.contentType,
      source: FeedSource.AD,
      score: 0,
      createdAt: new Date(),
    }));

    const merged = [...feedItems, ...celebrityItems]
      .filter((c) => {
        const key = `${c.contentType}:${c.contentId}`;
        return !seenIds.includes(key) && !skippedIds.includes(key);
      })
      .sort((a, b) => b.score - a.score);

    const hasMore = feeds.length > take || celebrityRaw.length > (take + 1) * 2;
    const result = hasMore ? merged.slice(0, take) : merged;

    adItems.forEach((ad, index) => {
      const insertAt = (index + 1) * 5;
      if (insertAt <= result.length) {
        result.splice(insertAt, 0, ad);
      }
    });

    const lastRealItem = [...result]
      .reverse()
      .find((item) => item.source !== FeedSource.AD);

    return {
      content: result.map((res) => ({
        contentId: res.contentId,
        contentType: res.contentType,
        isAd: res.source === FeedSource.AD,
      })),
      nextCursor: hasMore ? (lastRealItem?.score?.toString() ?? null) : null,
    };
  }

  async delete(data: DeleteContentJobData[]) {
    if (!data.length) return;

    const qb = this.feedRepo.createQueryBuilder().delete().from(Feed);

    data.forEach((item, index) => {
      qb.orWhere(
        `(contentId = :contentId${index}
        AND contentType = :type${index}
        AND userId = :userId${index})`,
        {
          [`contentId${index}`]: item.contentId,
          [`type${index}`]: item.type,
          [`userId${index}`]: item.followerId,
        },
      );
    });

    return qb.execute();
  }

  async getReelsFeed(cursor?: number, take?: number) {
    const userId = this.context.getUserId();

    const seenKey = `reels:seen:${userId}`;
    const skippedKey = `reels:skipped:${userId}`;
    const currentKey = `reels:current:${userId}`;

    const [topInterests, seenIds, skippedIds, currentId, user] =
      await Promise.all([
        this.interestService.getTopInterests(userId),
        this.redisInterest.smembers(seenKey),
        this.redisInterest.smembers(skippedKey),
        this.redisInterest.get(currentKey),
        this.userClient.getProfile(userId),
      ]);

    const age = user.dob
      ? new Date().getFullYear() - new Date(user.dob).getFullYear()
      : 3;

    const [contents, ads] = await Promise.all([
      this.contentClient.getContent(
        take ?? 20,
        cursor ?? 1,
        topInterests,
        userId,
      ),
      this.adClient.getAdFeeds(age, user.gender),
    ]);

    console.log('📥 contents from API:', contents.length);
    console.log('👁️ seenIds count:', seenIds.length);
    console.log('⏭️ skippedIds count:', skippedIds.length);

    const filtered = contents
      .filter((c) => {
        const key = `${c.contentType}:${c.contentId}`;
        if (key === currentId) return true;
        const isSeen = seenIds.includes(key);
        const isSkipped = skippedIds.includes(key);
        if (isSeen || isSkipped) {
          console.log(
            `🚫 Filtered out: ${key} | seen=${isSeen} skipped=${isSkipped}`,
          );
        }
        return !isSeen && !isSkipped;
      })
      .sort((a, b) => {
        const aKey = `${a.contentType}:${a.contentId}`;
        const bKey = `${b.contentType}:${b.contentId}`;
        if (aKey === currentId) return -1;
        if (bKey === currentId) return 1;
        return 0;
      });

    if (filtered.length === 0) {
      await this.redisInterest.del(skippedKey);
      const freshContents = await this.contentClient.getContent(
        take ?? 20,
        cursor ?? 1,
        topInterests,
        userId,
      );
      filtered.push(
        ...freshContents.filter((c) => {
          const key = `${c.contentType}:${c.contentId}`;
          return !seenIds.includes(key);
        }),
      );
    }

    console.log('✅ filtered count:', filtered.length);

    const adItems = ads.map((ad) => ({
      contentId: ad.contentId,
      contentType: ad.contentType,
      source: FeedSource.AD,
      score: 0,
      createdAt: new Date(),
    }));

    const result = [...filtered];
    adItems.forEach((ad, index) => {
      const insertAt = (index + 1) * 5;
      if (insertAt <= result.length) {
        result.splice(insertAt, 0, ad);
      }
    });

    return {
      content: result.map((res) => {
        return {
          contentId: res.contentId,
          contentType: res.contentType,
          isAd: res.source === FeedSource.AD,
        };
      }),
      nextCursor: filtered.length > 0 ? (cursor ?? 1) + 1 : null,
    };
  }

  async markReelCurrent(contentType: ContentType, contentId: number) {
    const userId = this.context.getUserId();
    await this.redisInterest.set(
      `reels:current:${userId}`,
      `${contentType}:${contentId}`,
      'EX',
      60 * 60,
    );
  }
}
