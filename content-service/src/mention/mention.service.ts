import { Injectable } from '@nestjs/common';
import { CreateMentionDto } from './dto/create-mention.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { In, Repository } from 'typeorm';
import { ContentType } from 'src/enums/content.type';
import { MentionResponse } from './dto/response-mentions.dto';

@Injectable()
export class MentionsService {
  constructor(
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
  ) {}

  async createMany(createMetionDtos: CreateMentionDto[]) {
    if (!createMetionDtos.length) return [];
    await this.mentionRepo.insert(createMetionDtos);
  }

  async deleteMany(id: number[]) {
    await this.mentionRepo.delete(id);
  }

  async findMany(
    targetId: number,
    targetType: ContentType,
  ): Promise<MentionResponse[]> {
    const mentions = await this.mentionRepo.find({
      where: {
        type: targetType,
        targetId: targetId,
      },
    });
    return mentions.map((mention) => {
      return {
        userId: mention.userId,
        username: mention.username,
      };
    });
  }

  async findManyByTargetIds(targetIds: number[], type: ContentType) {
    return this.mentionRepo.find({
      where: { targetId: In(targetIds), type },
    });
  }
}
