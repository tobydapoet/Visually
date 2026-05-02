import { ConflictException, Injectable } from '@nestjs/common';
import { CreateMentionDto } from './dto/create-mention.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { In, Repository } from 'typeorm';
import { ContentType } from 'src/enums/content.type';
import { MentionResponse } from './dto/response-mentions.dto';
import { UserClient } from 'src/client/user.client';

@Injectable()
export class MentionsService {
  constructor(
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    private userClient: UserClient,
  ) {}

  async createMany(userId: string, createMentionDtos: CreateMentionDto[]) {
    if (!createMentionDtos.length) return [];

    await this.userClient.getValidateBatchUsers(
      userId,
      createMentionDtos.map((m) => ({
        id: m.userId,
        username: m.username,
      })),
    );

    const { targetId, type } = createMentionDtos[0];

    const existingMentions = await this.mentionRepo.find({
      where: {
        targetId,
        type,
        userId: In(createMentionDtos.map((m) => m.userId)),
      },
    });

    if (existingMentions.length > 0) {
      const duplicates = existingMentions.map((m) => m.username).join(', ');
      throw new ConflictException(`Users already mentioned: ${duplicates}`);
    }

    await this.mentionRepo.insert(createMentionDtos);
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
