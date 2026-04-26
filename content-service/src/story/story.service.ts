import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  DataSource,
  In,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { MediaClient } from 'src/client/media.client';
import { Story } from './entities/story.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoryResponseDto } from './dto/response-story.dto';
import { ContextService } from 'src/context/context.service';
import { MusicResponse } from 'src/client/dto/MusicResponse.dto';
import { StoryInteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import {
  StoryResponsePageDto,
  StorySummaryResponsePageDto,
} from './dto/response-story-page.dto';
import { StoryStorageService } from 'src/story_storage/story_storage.service';
import { InteractionClient } from 'src/client/interaction.client';
import { ContentServiceType } from 'src/enums/content.type';
import { FollowClient } from 'src/client/follow.client';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    private readonly mediaClient: MediaClient,
    private readonly context: ContextService,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
    private storageService: StoryStorageService,
    private interactionClient: InteractionClient,
    private followClient: FollowClient,
  ) {}

  private readonly logger = new Logger(StoryService.name);

  async create(
    createStoryDto: CreateStoryDto,
    file: Express.Multer.File,
  ): Promise<Story> {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();
    const role = this.context.getRole();

    const files: Express.Multer.File[] = [file];
    const mediaResponses = await this.mediaClient.upload(
      files,
      'story',
      userId,
    );

    let musicResponse: MusicResponse | null = null;
    let startMusicTime: number | null = null;
    if (createStoryDto.musicId) {
      musicResponse = await this.mediaClient.getMusic(
        userId,
        role,
        createStoryDto.musicId,
      );
      startMusicTime = createStoryDto.startMusicTime ?? null;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();

      const story = this.storyRepo.create({
        userId,
        username,
        avatarUrl,

        mediaId: mediaResponses[0].id,
        mediaUrl: mediaResponses[0].url,

        startMusicTime: startMusicTime || undefined,

        musicId: createStoryDto.musicId,
        musicUrl: musicResponse?.url,

        createdAt: now,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const savedStory = await queryRunner.manager.save(Story, story);

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: savedStory.id,
          senderId: savedStory.userId,
          username,
          contentType: 'STORY',
          avatarUrl,
          createdAt: savedStory.createdAt,
        },
      });

      // this.kafkaClient.emit(`content.created`, {
      //   senderId: userId,
      //   username,
      //   avatarUrl,
      //   contentId: story.id,
      //   contentType: 'STORY',
      //   timestamp: new Date().toISOString(),
      // });

      await queryRunner.commitTransaction();

      return savedStory;
    } catch (error) {
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (mediaResponses?.length > 0) {
        try {
          await this.mediaClient.delete(
            userId,
            mediaResponses.map((media) => media.id),
          );
        } catch (cleanupError) {
          this.logger.error('Failed to cleanup media:', cleanupError);
        }
      }

      this.logger.error('Failed to create story:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const stories = await this.storyRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!stories.length) break;

      await this.storyRepo.update(
        { id: In(stories.map((p) => p.id)) },
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  async haveNonExpiredStory(userId: string): Promise<boolean> {
    const stories = await this.storyRepo.find({
      where: {
        userId,
        expiredAt: MoreThan(new Date()),
        isDeleted: false,
      },
    });
    if (stories.length > 0) {
      return true;
    }
    return false;
  }

  async getUserWithNonExpiredStory(userIds: string[]): Promise<string[]> {
    const stories = await this.storyRepo
      .createQueryBuilder('story')
      .select('DISTINCT story.userId', 'userId')
      .where('story.userId IN (:...userIds)', { userIds })
      .andWhere('story.expiredAt > :now', { now: new Date() })
      .andWhere('story.isDeleted = false')
      .getRawMany();

    return stories.map((s) => s.userId);
  }

  async getNonExpiredStoriesByUser(
    username: string,
  ): Promise<StoryResponseDto[]> {
    const currentUserId = this.context.getUserId();
    const stories = await this.storyRepo.find({
      where: {
        username: username,
        expiredAt: MoreThan(new Date()),
        isDeleted: false,
      },
      relations: ['storage'],
    });

    const interactions = await this.interactionClient.getCurrentInteraction(
      currentUserId,
      stories.map((story) => story.id),
      ContentServiceType.STORY,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return stories.map((story): StoryResponseDto => {
      const interaction = interactionMap.get(story.id);
      return {
        id: story.id,
        userId: story.userId,
        username: story.username,
        avatarUrl: story.avatarUrl,
        mediaUrl: story.mediaUrl,
        musicUrl: story.musicUrl,
        expiredAt: story.expiredAt,
        createdAt: story.createdAt,
        likeCount: story.likeCount,
        startMusicTime: story.startMusicTime,
        storageId: story?.storage?.id ?? null,
        isLiked: interaction?.isLiked ?? false,
        isCommented: interaction?.isCommented ?? false,
        isSaved: interaction?.isSaved ?? false,
      };
    });
  }

  async getNonExpiredStories(
    page: number,
    size: number,
  ): Promise<StorySummaryResponsePageDto> {
    const userId = this.context.getUserId();

    const fetchFollows = await this.followClient.getCurrentFollowed(
      userId,
      page - 1,
      size,
    );

    const followIds = fetchFollows.content.map((follow) => follow.id);
    const allUserIds = page === 1 ? [userId, ...followIds] : followIds;

    const stories = await this.storyRepo.query(
      `
      SELECT s.id, s.userId, s.username, s.avatarUrl, s.createdAt
      FROM stories s
      INNER JOIN (
        SELECT userId, MAX(createdAt) as maxCreatedAt
        FROM stories
        WHERE userId IN (?)
          AND expiredAt > NOW()
          AND isDeleted = false
        GROUP BY userId
      ) latest ON s.userId = latest.userId AND s.createdAt = latest.maxCreatedAt
      ORDER BY CASE WHEN s.userId = ? THEN 0 ELSE 1 END ASC, latest.maxCreatedAt DESC
      LIMIT ? OFFSET ?
      `,
      [allUserIds, userId, size, (page - 1) * size],
    );
    if (!stories.length) return { content: [], page, size, total: 0 };

    const isViewStories = await this.interactionClient.getStoriesView(
      stories.map((s: Story) => s.id),
      userId,
    );

    const viewMap = new Map(isViewStories.map((v) => [v.storyId, v.isViewed]));

    return {
      content: stories.map((story: Story) => ({
        id: story.id,
        userId: story.userId,
        username: story.username,
        avatarUrl: story.avatarUrl,
        isViewed: viewMap.get(story.id) ?? false,
      })),
      page,
      size,
      total: stories.length,
    };
  }

  async findOneWithUrl(storyId: number): Promise<StoryResponseDto> {
    const userId = this.context.getUserId();

    const story = await this.storyRepo.findOne({
      where: { id: storyId },
      relations: {
        storage: true,
      },
    });
    if (!story) {
      throw new NotFoundException(`Story not found!`);
    }

    const interaction = await this.interactionClient.getCurrentInteraction(
      userId,
      [storyId],
      ContentServiceType.POST,
    );

    return {
      id: storyId,
      userId: story.userId,
      avatarUrl: story.avatarUrl,
      musicUrl: story.musicUrl,
      username: story.username,
      mediaUrl: story.mediaUrl,
      expiredAt: story.expiredAt,
      createdAt: story.createdAt,
      startMusicTime: story.startMusicTime,
      storageId: story.storage?.id ?? null,
      likeCount: story.likeCount,
      isLiked: interaction[0]?.isLiked ?? false,
      isCommented: interaction[0]?.isCommented ?? false,
      isSaved: interaction[0]?.isSaved ?? false,
    };
  }

  async updateInteraction(storyId: number, action: StoryInteractionType) {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story not found!`);
    }
    switch (action) {
      case StoryInteractionType.LIKE:
        story.likeCount += 1;
        break;

      case StoryInteractionType.DISLIKE:
        if (story.likeCount > 0) {
          story.likeCount -= 1;
        }
        break;

      default:
        break;
    }
    await this.storyRepo.save(story);
  }

  async getManyStories(storyIds: number[]) {
    const stories = await this.storyRepo.findBy({
      id: In(storyIds),
    });
    return stories;
  }

  async findByUser(
    userId: string,
    page = 1,
    size = 10,
    filterStorage: boolean,
  ): Promise<StoryResponsePageDto> {
    const currentUserId = this.context.getUserId();

    const whereCondition = filterStorage
      ? {
          userId,
          storage: IsNull(),
          isDeleted: false,
        }
      : {
          userId,
          isDeleted: false,
        };

    const [stories, total] = await this.storyRepo.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    const interactions = await this.interactionClient.getCurrentInteraction(
      currentUserId,
      stories.map((story) => story.id),
      ContentServiceType.STORY,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return {
      content: stories.map((story) => {
        const interaction = interactionMap.get(story.id);

        return {
          id: story.id,
          userId: story.userId,
          avatarUrl: story.avatarUrl,
          username: story.username,
          mediaUrl: story.mediaUrl,
          musicUrl: story?.mediaUrl,
          expiredAt: story.expiredAt,
          createdAt: story.createdAt,
          likeCount: story.likeCount,
          isLiked: interaction?.isLiked ?? false,
          isCommented: interaction?.isCommented ?? false,
          isSaved: interaction?.isSaved ?? false,
        };
      }),
      page,
      size,
      total,
    };
  }

  async getCurrentUserStory(
    page = 1,
    size = 10,
  ): Promise<{
    content: StoryResponseDto[];
    page: number;
    size: number;
    total: number;
  }> {
    const userId = this.context.getUserId();
    return await this.findByUser(userId, page, size, false);
  }

  async getStoryInStorage(storageId: number): Promise<StoryResponseDto[]> {
    const userId = this.context.getUserId();
    const stories = await this.storyRepo.find({
      where: {
        storage: { id: storageId },
        isDeleted: false,
      },
      order: { createdAt: 'DESC' },
      relations: ['storage'],
    });

    const interactions = await this.interactionClient.getCurrentInteraction(
      userId,
      stories.map((story) => story.id),
      ContentServiceType.STORY,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return stories.map((story): StoryResponseDto => {
      const interaction = interactionMap.get(story.id);
      return {
        id: story.id,
        userId: story.userId,
        username: story.username,
        avatarUrl: story.avatarUrl,
        mediaUrl: story.mediaUrl,
        musicUrl: story.musicUrl,
        expiredAt: story.expiredAt,
        createdAt: story.createdAt,
        storageId: story?.storage?.id ?? null,
        likeCount: story.likeCount,
        startMusicTime: story.startMusicTime,
        isLiked: interaction?.isLiked ?? false,
        isCommented: interaction?.isCommented ?? false,
        isSaved: interaction?.isSaved ?? false,
      };
    });
  }

  async delete(id: number) {
    const userId = this.context.getUserId();

    try {
      const short = await this.storyRepo.findOne({
        where: { id },
      });

      if (!short) throw new NotFoundException('Story not found');

      if (short.userId !== userId) {
        throw new ForbiddenException();
      }
      await this.storyRepo.update({ id }, { isDeleted: true });
    } catch (err) {
      throw err;
    }
  }

  async addStoryToStorage(storageId: number, storyId: number) {
    await this.storyRepo.update(
      { id: storyId },
      { storage: { id: storageId } },
    );
  }

  async removeStoryFromStorage(storageId: number, storyId: number) {
    await this.storyRepo.update(
      { id: storyId },
      { storage: { id: null } as any },
    );

    const remaining = await this.storyRepo.count({
      where: { storage: { id: storageId } },
    });

    if (remaining === 0) {
      await this.storageService.remove(storageId);
    }
  }
}
