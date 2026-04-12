import { Injectable } from '@nestjs/common';
import { CreateMentionDto, MentionItem } from './dto/create-mention.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class MentionService {
  constructor(
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
  ) {}
  async createMany(dto: CreateMentionDto) {
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
