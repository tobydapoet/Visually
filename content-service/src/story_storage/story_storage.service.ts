import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoryStorage } from './entities/story_storage.entity';
import { Repository } from 'typeorm';
import { StoryStorageResponse } from './dto/response-story_storage.dto';
import { ContextService } from 'src/context/context.service';

@Injectable()
export class StoryStorageService {
  constructor(
    @InjectRepository(StoryStorage)
    private storyStorageRepo: Repository<StoryStorage>,
    private context: ContextService,
  ) {}
  async create(name: string, storyIds: number[]) {
    const userId = this.context.getUserId();

    const storage = await this.storyStorageRepo.save({
      name,
      userId,
    });

    if (storyIds.length > 0) {
      await this.storyStorageRepo
        .createQueryBuilder()
        .relation('stories')
        .of(storage.id)
        .add(storyIds);
    }

    return storage;
  }

  async findByUser(userId: string): Promise<StoryStorageResponse[]> {
    const storages = await this.storyStorageRepo.find({
      where: { userId },
      relations: ['stories'],
    });
    return storages.map((storage) => ({
      id: storage.id,
      url: storage.stories[0].mediaUrl,
      name: storage.name,
    }));
  }

  async findOne(id: number) {
    return this.storyStorageRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const userId = this.context.getUserId();
    const storage = await this.storyStorageRepo.findOne({
      where: { id, userId },
    });

    if (!storage) {
      throw new NotFoundException('StoryStorage not found');
    }

    return await this.storyStorageRepo.remove(storage);
  }

  async addStoryToStorage(storageId: number, storyIds: number[]) {
    await this.storyStorageRepo
      .createQueryBuilder()
      .relation(StoryStorage, 'stories')
      .of(storageId)
      .add(storyIds);
  }

  async removeStoryToStorage(storageId: number, storyIds: number[]) {
    const stories = await this.storyStorageRepo.find({
      where: { id: storageId },
    });
    if (stories.length === 1) {
      await this.remove(storageId);
    } else {
      await this.storyStorageRepo
        .createQueryBuilder()
        .relation(StoryStorage, 'stories')
        .of(storageId)
        .remove(storyIds);
    }
  }
}
