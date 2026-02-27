import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { DataSource, In, Repository } from 'typeorm';
import { MediaClient } from 'src/client/media.client';
import { Story } from './entities/story.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoryResponseDto } from './dto/response-story.dto';
import { ContextService } from 'src/context/context.service';
import { MusicResponse } from 'src/client/dto/MusicResponse.dto';
import { StoryStorageService } from 'src/story_storage/story_storage.service';
import { StoryInteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    private readonly mediaClient: MediaClient,
    private readonly context: ContextService,
    private storageService: StoryStorageService,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
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
    if (createStoryDto.musicId) {
      musicResponse = await this.mediaClient.getMusic(
        userId,
        createStoryDto.musicId,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const story = this.storyRepo.create({
        userId,
        username,
        avatarUrl,

        mediaId: mediaResponses[0].id,
        mediaUrl: mediaResponses[0].url,

        musicId: createStoryDto.musicId,
        musicUrl: musicResponse?.url,

        createdAt: now,
        expiredAt,
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
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story not found!`);
    }

    return {
      id: storyId,
      userId: story.userId,
      avatarUrl: story.avatarUrl,
      musicUrl: story.musicUrl,
      username: story.username,
      mediaUrl: story.mediaUrl,
      expiredAt: story.expiredAt,
      createdAt: story.createdAt,
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

  async findByUser(
    userId: string,
    page = 1,
    size = 10,
  ): Promise<{
    content: StoryResponseDto[];
    page: number;
    size: number;
    total: number;
  }> {
    const [stories, total] = await this.storyRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: stories.map((story) => ({
        id: story.id,
        userId: story.userId,
        avatarUrl: story.avatarUrl,
        username: story.username,
        mediaUrl: story.mediaUrl,
        musicUrl: story?.mediaUrl,
        expiredAt: story.expiredAt,
        createdAt: story.createdAt,
      })),
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
    return await this.findByUser(userId, page, size);
  }

  async saveToStorage(storyId: number, storageId: number) {
    const storage = await this.storageService.findOne(storageId);
    if (!storage) {
      throw new NotFoundException("Can't find this storage!");
    }

    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException("Can't find this story!");
    }

    story.storage = storage;

    await this.storyRepo.save(story);

    return story;
  }

  async findByStorage(storageId: number): Promise<StoryResponseDto[]> {
    const stories = await this.storyRepo.find({
      where: { storage: { id: storageId } },
      order: { createdAt: 'DESC' },
    });

    const content: StoryResponseDto[] = stories.map((story) => ({
      id: story.id,
      userId: story.userId,
      avatarUrl: story.avatarUrl,
      username: story.username,
      musicUrl: story.mediaUrl,
      mediaUrl: story.mediaUrl,
      musicId: story.musicId,
      expiredAt: story.expiredAt,
      createdAt: story.createdAt,
    }));

    return content;
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
}
