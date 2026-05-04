import { Injectable } from '@nestjs/common';
import { CreateMentionDto, MentionItem } from './dto/create-mention.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { In, Repository } from 'typeorm';
import { UserClient } from 'src/client/user.client';
import { ContextService } from 'src/context/context.service';

@Injectable()
export class MentionService {
  constructor(
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    private userClient: UserClient,
    private context: ContextService,
  ) {}
  async createMany(dto: CreateMentionDto) {
    const userId = this.context.getUserId();
    console.log(
      'createMany called, userId:',
      userId,
      'mentions:',
      dto.mentions,
    );

    if (!dto.mentions.length) return [];

    try {
      await this.userClient.getValidateBatchUsers(
        userId,
        dto.mentions.map((m) => ({
          id: m.userId,
          username: m.username,
        })),
      );
    } catch (err: any) {
      console.error('getValidateBatchUsers error:', err.message, err.status);
      throw err;
    }

    const mentions = dto.mentions.map((m) =>
      this.mentionRepo.create({
        userId: m.userId,
        username: m.username,
        comment: { id: dto.commentId },
      }),
    );

    await this.mentionRepo.save(mentions);
  }

  async updateMentions(commentId: number, mentions?: MentionItem[]) {
    await this.mentionRepo.delete({ comment: { id: commentId } });

    if (!mentions?.length) return;

    const entities = mentions.map((m) =>
      this.mentionRepo.create({
        userId: m.userId,
        username: m.username,
        comment: { id: commentId },
      }),
    );

    await this.mentionRepo.save(entities);
  }
}
