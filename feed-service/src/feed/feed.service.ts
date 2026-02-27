import { Injectable } from '@nestjs/common';
import { CreateFeedDto } from './dto/create-feed.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Feed } from './entities/feed.entity';
import { Repository } from 'typeorm';
import { ContentType } from 'src/enums/ContentType';
import { FeedSource } from 'src/enums/FeedSource';
import { ContentEdge } from 'src/content_edge/entities/content_edge.entity';
import { ContentEdgeService } from 'src/content_edge/content_edge.service';
import { AdClient } from 'src/client/ad.client';
import { FeedItem, FeedRepose } from './dto/response-feed.dto';
import { AdFeedResponse } from 'src/client/dtos/adFeedReponse';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Feed) private feedRepo: Repository<Feed>,
    private contentEdgeService: ContentEdgeService,
    private adClient: AdClient,
  ) {}
  create(createFeedDtos: CreateFeedDto[]) {
    return this.feedRepo.save(createFeedDtos);
  }

  delete(contentId: number, type: ContentType) {
    return this.feedRepo.delete({ contentId, contentType: type });
  }

  private async injectTrending(userId: string, contents: ContentEdge[]) {
    const feeds = contents.map((c) => ({
      userId,
      contentId: c.contentId,
      contentType: c.contentType,
      source: FeedSource.TRENDING,
      score: 100,
      isSeen: false,
    }));

    await this.feedRepo
      .createQueryBuilder()
      .insert()
      .into('feed')
      .values(feeds)
      .orIgnore()
      .execute();
  }

  private injectAdsIntoFeed(
    feeds: FeedRepose[],
    ads: AdFeedResponse[],
  ): FeedItem[] {
    const result: FeedItem[] = [];
    let adIndex = 0;

    for (let i = 0; i < feeds.length; i++) {
      result.push({
        contentId: feeds[i].contentId,
        contentType: feeds[i].contentType,
        isSponsored: false,
      });

      if ((i + 1) % 5 === 0 && adIndex < ads.length) {
        result.push({
          contentId: ads[adIndex].adContentId,
          contentType: ads[adIndex].adType,
          isSponsored: true,
        });
        adIndex++;
      }
    }

    return result;
  }

  async getByUser(
    userId: string,
    contentType: ContentType,
    size: number,
  ): Promise<FeedItem[]> {
    let feeds = await this.feedRepo.find({
      where: { userId, contentType },
      order: { score: 'DESC', createdAt: 'DESC' },
      take: size,
    });

    if (feeds.length < size) {
      const trending = await this.contentEdgeService.getTrendingNotInFeed(
        userId,
        contentType,
        size - feeds.length,
      );
      if (trending.length) await this.injectTrending(userId, trending);

      feeds = await this.feedRepo.find({
        where: { userId, contentType },
        order: { score: 'DESC', createdAt: 'DESC' },
        take: size,
      });
    }

    const ads =
      feeds.length >= 5
        ? await this.adClient
            .getAdFeeds(userId, feeds.length, contentType)
            .catch(() => [])
        : [];

    return this.injectAdsIntoFeed(feeds, ads);
  }
}
