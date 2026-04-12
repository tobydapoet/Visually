import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { MediaClient } from 'src/client/media.client';
import { Story } from './entities/story.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoryResponseDto } from './dto/response-story.dto';
import { ContextService } from 'src/context/context.service';
import { MusicResponse } from 'src/client/dto/MusicResponse.dto';
import { StoryInteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { StoryResponsePageDto } from './dto/response-story-page.dto';
import { StoryStorageService } from 'src/story_storage/story_storage.service';
import { plainToInstance } from 'class-transformer';
import { InteractionClient } from 'src/client/interaction.client';
import { ContentServiceType } from 'src/enums/content.type';

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
  ) {}

  private readonly logger = new Logger(StoryService.name);

  async create(
    createStoryDto: CreateStoryDto,
    file: Express.Multer.File,
  ): Promise<Story> {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();

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
          authorId: savedStory.userId,
          username,
          type: 'STORY',
          avatarUrl,
          createdAt: savedStory.createdAt,
        },
      });

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
      isShared: interaction[0]?.isShared ?? false,
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

      case StoryInteractionType.UNLIKE:
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
        }
      : {
          userId,
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
          isShared: interaction?.isShared ?? false,
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

  async getStoryInStorage(
    storageId: number,
    page = 1,
  ): Promise<{
    content: StoryResponseDto[];
    page: number;
    total: number;
  }> {
    const userId = this.context.getUserId();
    const [stories, total] = await this.storyRepo.findAndCount({
      where: {
        storage: { id: storageId },
        isDeleted: false,
      },

      skip: page - 1,
      take: 1,
      order: {
        createdAt: 'DESC',
      },
    });

    const interactions = await this.interactionClient.getCurrentInteraction(
      userId,
      stories.map((story) => story.id),
      ContentServiceType.STORY,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return {
      content: stories.map((story): StoryResponseDto => {
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
          isLiked: interaction?.isLiked ?? false,
          isCommented: interaction?.isCommented ?? false,
          isShared: interaction?.isShared ?? false,
          isSaved: interaction?.isSaved ?? false,
        };
      }),
      page,
      total,
    };
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
