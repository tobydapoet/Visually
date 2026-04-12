import { Injectable } from '@nestjs/common';
import { CreateMentionDto, MentionItem } from './dto/create-mention.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { EntityManager, In, Repository } from 'typeorm';

@Injectable()
export class MentionService {
  constructor(
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
  ) {}
  async createMany(
    dto: { mentions: MentionItem[]; messageId: number },
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(Mention) : this.mentionRepo;

    const entities = dto.mentions.map((m) =>
      repo.create({
        userId: m.userId,
        username: m.username,
        message: { id: dto.messageId },
      }),
    );

    await repo.save(entities);
  }
  async updateMentions(messageId: number, mentions?: MentionItem[]) {
    await this.mentionRepo.delete({ message: { id: messageId } });

    if (!mentions?.length) return;

    const entities = mentions.map((m) =>
      this.mentionRepo.create({
        userId: m.userId,
        username: m.username,
        message: { id: messageId },
      }),
    );

    await this.mentionRepo.save(entities);
  }
}
