import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FeedPageResponse,
  FeedResponse,
} from 'src/client/dto/FeedResponse.dto';
import { FeedClient } from 'src/client/feed.client';
import { ContextService } from 'src/context/context.service';
import { Post } from 'src/post/entities/post.entity';
import {
  DefaultSummaryReponseDto,
  FeedReponseDto,
} from 'src/repost/dto/respose-default.dto';
import { Short } from 'src/short/entities/short.entity';
import { In, Repository } from 'typeorm';
import {
  FeedContentPageResponse,
  FeedContentResponse,
} from './dto/response-feed.dto';
import { InteractionClient } from 'src/client/interaction.client';
import { ContentServiceType, ContentType } from 'src/enums/content.type';
import { InteractionResponse } from 'src/client/dto/InteractionResponse.dto';
import { MentionsService } from 'src/mention/mention.service';
import { TagService } from 'src/tag/tag.service';
import { Mention } from 'src/mention/entities/mention.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { RepostService } from 'src/repost/repost.service';
import { Repost } from 'src/repost/entities/repost.entity';
import { FollowClient } from 'src/client/follow.client';
import { StoryService } from 'src/story/story.service';
import { Story } from 'src/story/entities/story.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Short)
    private readonly shortRepo: Repository<Short>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    private readonly storyService: StoryService,
    private feedClient: FeedClient,
    private context: ContextService,
    private interactionClient: InteractionClient,
    private tagService: TagService,
    private mentionService: MentionsService,
    private followClient: FollowClient,
    private repostService: RepostService,
  ) {}

  async getRecentContentByUserId(userId: string): Promise<FeedReponseDto[]> {
    return this.postRepo.manager.query(
      `
    SELECT id as contentId, 
          'POST' as contentType, 
          createdAt
    FROM posts p
    WHERE p.userId = ?

    UNION ALL

    SELECT id as contentId, 
          'SHORT' as contentType, 
          createdAt
    FROM shorts s
    WHERE s.userId = ?

    ORDER BY createdAt DESC
    LIMIT 5
    `,
      [userId, userId],
    );
  }

  async searchContent(
    size = 20,
    page = 1,
    tag?: string,
    caption?: string,
  ): Promise<DefaultSummaryReponseDto[]> {
    const userId = this.context.getUserId();
    const offset = (page - 1) * size;
    const params: any[] = [];

    const blockedUserIds = await this.followClient.getCurrentBlockers(userId);

    const blockFilter =
      blockedUserIds.length > 0
        ? `AND userId NOT IN (${blockedUserIds.map(() => '?').join(',')})`
        : '';

    let postWhere = `WHERE 1=1 ${blockFilter}`;
    let shortWhere = `WHERE 1=1 ${blockFilter}`;

    if (blockedUserIds.length > 0) {
      params.push(...blockedUserIds);
      params.push(...blockedUserIds);
    }

    if (tag && caption) {
      postWhere += ` AND (
      EXISTS (
        SELECT 1 FROM tags t
        WHERE t.targetId = p.id
          AND t.type = 'POST'
          AND t.name LIKE ?
      ) OR p.caption LIKE ?
    )`;
      shortWhere += ` AND (
      EXISTS (
        SELECT 1 FROM tags t
        WHERE t.targetId = s.id
          AND t.type = 'SHORT'
          AND t.name LIKE ?
      ) OR s.caption LIKE ?
    )`;
      params.push(`%${tag}%`, `%${caption}%`);
      params.push(`%${tag}%`, `%${caption}%`);
    } else {
      if (tag) {
        postWhere += ` AND EXISTS (
        SELECT 1 FROM tags t
        WHERE t.targetId = p.id
          AND t.type = 'POST'
          AND t.name LIKE ?
      )`;
        shortWhere += ` AND EXISTS (
        SELECT 1 FROM tags t
        WHERE t.targetId = s.id
          AND t.type = 'SHORT'
          AND t.name LIKE ?
      )`;
        params.push(`%${tag}%`);
        params.push(`%${tag}%`);
      }

      if (caption) {
        postWhere += ` AND p.caption LIKE ?`;
        shortWhere += ` AND s.caption LIKE ?`;
        params.push(`%${caption}%`);
        params.push(`%${caption}%`);
      }
    }

    params.push(size, offset);

    return this.postRepo.manager.query(
      `
    SELECT id, userId, likeCount, commentCount,
           (SELECT mediaUrl FROM post_medias WHERE postId = p.id LIMIT 1) as thumbnailUrl,
           'POST' as type, createdAt
    FROM posts p
    ${postWhere}

    UNION ALL

    SELECT id, userId, likeCount, commentCount,
           thumbnailUrl, 'SHORT', createdAt
    FROM shorts s
    ${shortWhere}

    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
    `,
      params,
    );
  }

  async findIdContentByTarget(id: number, type: ContentServiceType) {
    const repoMap = {
      [ContentServiceType.POST]: this.postRepo,
      [ContentServiceType.SHORT]: this.shortRepo,
      [ContentServiceType.STORY]: this.storyRepo,
    };

    const repo = repoMap[type];
    if (!repo) throw new BadRequestException('Invalid type request');

    const res = await repo.findOne({ where: { id } });
    if (!res) throw new NotFoundException("Can't find this content");

    return true;
  }

  async searchFeedContent(
    size = 20,
    page = 1,
    tags: string[],
  ): Promise<FeedReponseDto[]> {
    const offset = (page - 1) * size;
    const params: any[] = [];

    let postWhere = 'WHERE 1=1';
    let shortWhere = 'WHERE 1=1';

    if (tags.length <= 0) {
      tags = await this.tagService.getRandomTags();
    }

    if (tags.length > 0) {
      const placeholders = tags.map(() => '?').join(', ');
      const captionConditions = tags.map(() => 'p.caption LIKE ?').join(' OR ');
      const captionConditionsShort = tags
        .map(() => 's.caption LIKE ?')
        .join(' OR ');

      postWhere += ` AND (
      EXISTS (
        SELECT 1 FROM tags t
        WHERE t.targetId = p.id
          AND t.type = 'POST'
          AND t.name IN (${placeholders})
      ) OR ${captionConditions}
    )`;

      shortWhere += ` AND (
      EXISTS (
        SELECT 1 FROM tags t
        WHERE t.targetId = s.id
          AND t.type = 'SHORT'
          AND t.name IN (${placeholders})
      ) OR ${captionConditionsShort}
    )`;

      params.push(...tags);
      tags.forEach((t) => params.push(`%${t}%`));

      params.push(...tags);
      tags.forEach((t) => params.push(`%${t}%`));
    }

    params.push(size, offset);

    return this.postRepo.manager.query(
      `
    SELECT id as contentId, 'POST' as contentType, createdAt
    FROM posts p
    ${postWhere}

    UNION ALL

    SELECT id as contentId, 'SHORT' as contentType, createdAt
    FROM shorts s
    ${shortWhere}

    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `,
      params,
    );
  }

  async getFeedContent(
    type: 'HOME' | 'REEL' = 'REEL',
    cursor?: string,
    take: number = 20,
  ): Promise<FeedContentPageResponse> {
    const userId = this.context.getUserId();

    let feedRes: FeedPageResponse;

    if (type === 'HOME') {
      feedRes = await this.feedClient.getHomeFeed(userId, take, cursor);
    } else {
      feedRes = await this.feedClient.getReelFeed(userId, take, cursor);
    }

    if (!feedRes.content.length) {
      return { content: [], nextCursor: null };
    }

    const postIds = feedRes.content
      .filter((f) => f.contentType === 'POST')
      .map((f) => Number(f.contentId));

    const shortIds = feedRes.content
      .filter((f) => f.contentType === 'SHORT')
      .map((f) => Number(f.contentId));

    const [
      posts,
      shorts,
      postInteractions,
      shortInteractions,
      postTags,
      shortTags,
      postMentions,
      shortMentions,
      postRepost,
      shortRepost,
    ] = await Promise.all([
      postIds.length
        ? this.postRepo.find({
            where: { id: In(postIds) },
            relations: ['medias'],
          })
        : [],
      shortIds.length ? this.shortRepo.findBy({ id: In(shortIds) }) : [],
      postIds.length
        ? this.interactionClient.getCurrentInteraction(
            userId,
            postIds,
            ContentServiceType.POST,
          )
        : ([] as InteractionResponse[]),
      shortIds.length
        ? this.interactionClient.getCurrentInteraction(
            userId,
            shortIds,
            ContentServiceType.SHORT,
          )
        : ([] as InteractionResponse[]),
      postIds.length
        ? this.tagService.findByTargetIds(postIds, ContentType.POST)
        : ([] as Tag[]),
      shortIds.length
        ? this.tagService.findByTargetIds(shortIds, ContentType.SHORT)
        : ([] as Tag[]),
      postIds.length
        ? this.mentionService.findManyByTargetIds(postIds, ContentType.POST)
        : ([] as Mention[]),
      shortIds.length
        ? this.mentionService.findManyByTargetIds(shortIds, ContentType.SHORT)
        : ([] as Mention[]),
      postIds.length
        ? this.repostService.findRepostByTargetIds(postIds, ContentType.POST)
        : ([] as Repost[]),
      shortIds.length
        ? this.repostService.findRepostByTargetIds(shortIds, ContentType.SHORT)
        : ([] as Repost[]),
    ]);

    const interactionMap = new Map<number, InteractionResponse>([
      ...postInteractions.map(
        (i) => [i.targetId, i] as [number, InteractionResponse],
      ),
      ...shortInteractions.map(
        (i) => [i.targetId, i] as [number, InteractionResponse],
      ),
    ]);

    const feedUserIds = [
      ...new Set([
        ...posts.map((p: Post) => p.userId),
        ...shorts.map((s: Short) => s.userId),
      ]),
    ];

    const usersWithStory =
      await this.storyService.getUserWithNonExpiredStory(feedUserIds);
    const usersWithStorySet = new Set(usersWithStory);

    const postMap = new Map<number, Post>(
      posts.map((p: Post) => [p.id, p] as [number, Post]),
    );
    const shortMap = new Map<number, Short>(
      shorts.map((s: Short) => [s.id, s] as [number, Short]),
    );

    const tagMap = new Map<number, Tag[]>();
    [...postTags, ...shortTags].forEach((tag) => {
      if (!tagMap.has(tag.targetId)) tagMap.set(tag.targetId, []);
      tagMap.get(tag.targetId)!.push(tag);
    });

    const mentionMap = new Map<number, Mention[]>();
    [...postMentions, ...shortMentions].forEach((mention) => {
      if (!mentionMap.has(mention.targetId))
        mentionMap.set(mention.targetId, []);
      mentionMap.get(mention.targetId)!.push(mention);
    });

    const repostMap = new Map<number, Repost[]>();
    [...postRepost, ...shortRepost].forEach((repost) => {
      if (!repostMap.has(repost.originalId))
        repostMap.set(repost.originalId, []);
      repostMap.get(repost.originalId)!.push(repost);
    });

    const content = feedRes.content
      .map((f) => {
        if (f.contentType === 'POST') {
          const item = postMap.get(Number(f.contentId));
          if (!item) return null;
          const interaction = interactionMap.get(Number(f.contentId));
          return {
            id: item.id,
            userId: item.userId,
            username: item.username,
            avatarUrl: item.avatarUrl,
            caption: item.caption,
            medias: item.medias?.map((m) => m.mediaUrl) ?? [],
            likeCount: item.likeCount,
            commentCount: item.commentCount,
            saveCount: item.saveCount,
            repostCount: item.repostCount,
            contentType: 'POST',
            isLiked: interaction?.isLiked ?? false,
            isCommented: interaction?.isCommented ?? false,
            isSaved: interaction?.isSaved ?? false,
            createdAt: item.createdAt,
            status: item.status,
            hasNewStory: usersWithStorySet.has(item.userId),
            tags:
              tagMap.get(item.id)?.map((t) => ({
                id: t.id,
                name: t.name,
              })) ?? [],
            mentions:
              mentionMap.get(item.id)?.map((m) => ({
                userId: m.userId,
                username: m.username,
              })) ?? [],
            isReposted: (repostMap.get(item.id) ?? []).some(
              (r) => r.userId === userId,
            ),
            isAd: f.isAd,
          } as FeedContentResponse;
        }

        if (f.contentType === 'SHORT') {
          const item = shortMap.get(Number(f.contentId));
          if (!item) return null;
          const interaction = interactionMap.get(Number(f.contentId));
          return {
            id: item.id,
            userId: item.userId,
            username: item.username,
            avatarUrl: item.avatarUrl,
            caption: item.caption,
            medias: [item.mediaUrl],
            likeCount: item.likeCount,
            commentCount: item.commentCount,
            saveCount: item.saveCount,
            repostCount: item.repostCount,
            contentType: 'SHORT',
            isLiked: interaction?.isLiked ?? false,
            isCommented: interaction?.isCommented ?? false,
            isSaved: interaction?.isSaved ?? false,
            createdAt: item.createdAt,
            status: item.status,
            hasNewStory: usersWithStorySet.has(item.userId),
            tags:
              tagMap.get(item.id)?.map((t) => ({
                id: t.id,
                name: t.name,
              })) ?? [],
            mentions:
              mentionMap.get(item.id)?.map((m) => ({
                userId: m.userId,
                username: m.username,
              })) ?? [],
            isReposted: (repostMap.get(item.id) ?? []).some(
              (r) => r.userId === userId,
            ),
            isAd: f.isAd,
          } as FeedContentResponse;
        }

        return null;
      })
      .filter(
        (item): item is FeedContentResponse =>
          item !== null && item !== undefined,
      );

    return {
      content,
      nextCursor: feedRes.nextCursor,
    };
  }
}
