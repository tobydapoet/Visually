import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoryStorage } from './entities/story_storage.entity';
import { Repository } from 'typeorm';
import { StoryStorageResponse } from './dto/response-story_storage.dto';

@Injectable()
export class StoryStorageService {
  constructor(
    @InjectRepository(StoryStorage)
    private storyStorageRepo: Repository<StoryStorage>,
  ) {}
  create(userId: string, name: string) {
    const newStorage = this.storyStorageRepo.create({
      name,
      userId,
    });
    return this.storyStorageRepo.save(newStorage);
  }

  async findByUser(userId: string): Promise<StoryStorageResponse[]> {
    const storages = await this.storyStorageRepo.find({ where: { userId } });
    return storages.map((storage) => ({
      id: storage.id,
      url: storage.stories?.[0]?.mediaUrl ?? undefined,
      name: storage.name,
    }));
  }

  async findOne(id: number) {
    return this.storyStorageRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const storage = await this.storyStorageRepo.findOne({
      where: { id },
    });

    if (!storage) {
      throw new NotFoundException('StoryStorage not found');
    }

    return await this.storyStorageRepo.remove(storage);
  }
}
