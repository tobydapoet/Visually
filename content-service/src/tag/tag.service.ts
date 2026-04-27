import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import { EntityManager, ILike, In, Repository } from 'typeorm';
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

  async getRandomTags(): Promise<string[]> {
    const tags = await this.tagRepo
      .createQueryBuilder('tag')
      .select('tag.name')
      .orderBy('RAND()')
      .limit(5)
      .getMany();

    return tags.map((tag) => tag.name);
  }

  async findByTargetIds(
    targetIds: number[],
    type: ContentType,
  ): Promise<Tag[]> {
    return this.tagRepo.find({
      where: { targetId: In(targetIds), type: type },
    });
  }

  async findTag(keyword: string, page = 1, size = 20) {
    const skip = (page - 1) * size;

    const [content, total] = await this.tagRepo.findAndCount({
      where: {
        name: ILike(`%${keyword}%`),
      },
      take: size,
      skip,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      content,
      total,
      page,
      size,
    };
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
