import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentType } from 'src/enums/content.type';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
  ) {}

  async findByTargetId(
    targetId: number,
    type: ContentType,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(Tag) : this.tagRepo;

    return repo.find({ where: { targetId, type } });
  }

  async createMany(
    createTagDto: CreateTagDto,
    manager?: EntityManager,
  ): Promise<Tag[]> {
    const repo = manager ? manager.getRepository(Tag) : this.tagRepo;

    const { targetId, type, names } = createTagDto;

    const existingTags = await repo.find({
      where: {
        targetId,
        type,
        name: In(names),
      },
    });

    if (existingTags.length > 0) {
      const duplicates = existingTags.map((t) => t.name).join(', ');
      throw new ConflictException(`Tags already exist: ${duplicates}`);
    }

    const tags = names.map((name) =>
      repo.create({
        targetId,
        type,
        name,
      }),
    );

    return await repo.save(tags);
  }

  async removeMany(
    ids: number[],
    manager?: EntityManager,
  ): Promise<{ deleted: number }> {
    const repo = manager ? manager.getRepository(Tag) : this.tagRepo;

    const tags = await repo.find({
      where: { id: In(ids) },
    });

    if (tags.length === 0) {
      throw new NotFoundException('No tags found with the provided IDs');
    }

    const result = await repo.delete({ id: In(ids) });

    return {
      deleted: result.affected || 0,
    };
  }
}
