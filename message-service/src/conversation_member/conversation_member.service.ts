import { Injectable } from '@nestjs/common';
import { CreateConversationMemberDto } from './dto/create-conversation_member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation_member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { ConversationMember } from './entities/conversation_member.entity';
import { UserClient } from '../client/user.client';

@Injectable()
export class ConversationMemberService {
  constructor(
    @InjectRepository(ConversationMember)
    private memberRepo: Repository<ConversationMember>,
    private userClient: UserClient,
  ) {}

  async create(
    createConversationMemberDto: CreateConversationMemberDto,
    manager: EntityManager,
  ) {
    const users = await this.userClient.getUsers(
      createConversationMemberDto.userIds,
    );
    const members = users.map((user) => {
      return this.memberRepo.create({
        avatarUrl: user.avatarUrl,
        conversation: { id: createConversationMemberDto.conversationId },
        userId: user.userId,
        username: user.username,
      });
    });

    await manager.save(ConversationMember, members);
  }

  findByConversation(conversationId: number) {
    const members = this.memberRepo.find({
      where: { conversation: { id: conversationId } },
    });
    return members;
  }

  findOne(id: number) {
    return this.memberRepo.findOne({ where: { id } });
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const posts = await this.memberRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!posts.length) break;

      await this.memberRepo.update(
        { id: In(posts.map((p) => p.id)) },
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  update(id: number, nickname: string) {
    return this.memberRepo.update({ id }, { nickname });
  }

  remove(id: number) {
    return this.memberRepo.delete({ id });
  }
}
