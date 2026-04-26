import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateConversationMemberDto } from './dto/create-conversation_member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation_member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Like,
  Not,
  Repository,
} from 'typeorm';
import { ConversationMember } from './entities/conversation_member.entity';
import { UserClient } from '../client/user.client';
import { MessageService } from '../message/message.service';
import { ContextService } from '../context/context.service';
import { MemberSummaryResponse } from './dto/response-conversation_member.dto';

@Injectable()
export class ConversationMemberService {
  constructor(
    @InjectRepository(ConversationMember)
    private memberRepo: Repository<ConversationMember>,
    private userClient: UserClient,
    private readonly dataSource: DataSource,
    private mesasgeService: MessageService,
    private context: ContextService,
  ) {}

  async create(
    createConversationMemberDto: CreateConversationMemberDto,
    manager: EntityManager,
  ) {
    const existedMembers = await manager.find(ConversationMember, {
      where: {
        conversation: { id: createConversationMemberDto.conversationId },
        userId: In(createConversationMemberDto.userIds),
        deletedAt: IsNull(),
      },
    });

    if (existedMembers.length > 0) {
      const existedUserIds = existedMembers.map((m) => m.userId);
      throw new BadRequestException(
        `Users already in conversation: ${existedUserIds.join(', ')}`,
      );
    }

    const users = await this.userClient.getUsers(
      createConversationMemberDto.userIds,
    );

    const members = users.map((user) =>
      manager.create(ConversationMember, {
        avatarUrl: user.avatar,
        conversation: { id: createConversationMemberDto.conversationId },
        userId: user.id,
        username: user.username,
      }),
    );

    await manager.save(ConversationMember, members);
  }

  async updateLastSeen(conversationId: number) {
    const userId = this.context.getUserId();

    const lastMessage =
      await this.mesasgeService.getLastMessage(conversationId);

    if (!lastMessage) return;

    await this.memberRepo.update(
      { userId, conversation: { id: conversationId } },
      { lastSeenMessageId: lastMessage.id },
    );
  }

  async getMemberByConversation(
    conversationId: number,
  ): Promise<MemberSummaryResponse[]> {
    const members = await this.memberRepo.find({
      where: {
        conversation: { id: conversationId },
        deletedAt: IsNull(),
      },
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      username: member.username,
      avatarUrl: member.avatarUrl,
      lastSeen: member.lastSeen ?? null,
    }));
  }

  async searchMemberByConversation(
    conversationId: number,
    keyword: string,
  ): Promise<MemberSummaryResponse[]> {
    const userId = this.context.getUserId();
    const members = await this.memberRepo.find({
      where: {
        conversation: { id: conversationId },
        deletedAt: IsNull(),
        username: Like(`%${keyword}%`),
        userId: Not(userId),
      },
      take: 5,
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      username: member.username,
      avatarUrl: member.avatarUrl,
      lastSeen: member.lastSeen ?? null,
    }));
  }

  async invite(createConversationMemberDto: CreateConversationMemberDto) {
    const { conversationId, userIds } = createConversationMemberDto;

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ConversationMember);

      const existingMembers = await repo.find({
        where: userIds.map((userId) => ({
          conversation: { id: conversationId },
          userId,
        })),
        withDeleted: true,
      });

      const existingUserIds = existingMembers.map((m) => m.userId);
      if (existingMembers.length > 0) {
        await repo.restore(existingMembers.map((m) => m.id));
      }

      const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));
      if (newUserIds.length > 0) {
        await this.create({ conversationId, userIds: newUserIds }, manager);
      }
    });
  }

  async removeMember(id: number) {
    const now = new Date();
    return this.memberRepo.update({ id }, { deletedAt: now });
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

  async updateStatus(userId: string, lastSeen: Date | null) {
    await this.memberRepo.update({ userId }, { lastSeen });
  }
}
