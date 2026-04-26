import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { DataSource, Repository } from 'typeorm';
import { ConversationMemberService } from '../conversation_member/conversation_member.service';
import { ContextService } from '../context/context.service';
import { ConversationType } from '../enums/conversation.type';
import { MediaClient } from '../client/media.client';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { FollowClient } from '../client/follow.client';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    private memberService: ConversationMemberService,
    private mediaClient: MediaClient,
    private followClient: FollowClient,
    private dataSource: DataSource,
    private context: ContextService,
  ) {}

  async create(createConversationDto: CreateConversationDto) {
    return this.dataSource.transaction(async (manager) => {
      const newConversation = this.conversationRepo.create({
        ...createConversationDto,
        type:
          createConversationDto.memberIds.length > 2
            ? ConversationType.GROUP
            : ConversationType.PRIVATE,
      });
      const savedConversation =
        await this.conversationRepo.save(newConversation);
      await this.memberService.create(
        {
          conversationId: savedConversation.id,
          userIds: createConversationDto.memberIds,
        },
        manager,
      );
      return savedConversation;
    });
  }

  async update(
    converstationId: number,
    updateConversationDto: UpdateConversationDto,
    file?: Express.Multer.File,
  ) {
    const userId = this.context.getUserId();

    const existingConversation = await this.conversationRepo.findOne({
      where: { id: converstationId },
    });

    if (!existingConversation) {
      throw new NotFoundException("Can't find this conversation");
    }

    let mediaId = existingConversation.mediaId;
    let mediaUrl = existingConversation.mediaUrl;

    if (file) {
      if (existingConversation.mediaId) {
        await this.mediaClient.delete([existingConversation.mediaId], userId);
      }

      const res = await this.mediaClient.upload([file], userId);
      mediaId = res[0].id;
      mediaUrl = res[0].url;
    }

    const updateData: any = {};

    if (updateConversationDto.name !== undefined) {
      updateData.name = updateConversationDto.name;
    }

    if (file) {
      updateData.mediaId = mediaId;
      updateData.mediaUrl = mediaUrl;
    }

    return await this.conversationRepo.update(
      { id: converstationId },
      updateData,
    );
  }

  async findPrivateConversation(userBId: string) {
    const userAId = this.context.getUserId();

    return this.conversationRepo
      .createQueryBuilder('c')
      .innerJoin('c.members', 'm')
      .where('m.userId IN (:...userIds)', {
        userIds: [userAId, userBId],
      })
      .andWhere('m.deletedAt IS NULL')
      .groupBy('c.id')
      .having('COUNT(DISTINCT m.userId) = 2')
      .getOne();
  }

  async findOne(id: number) {
    const userId = this.context.getUserId();
    const conversation = await this.conversationRepo.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException("Can't find this conversation");
    }

    const otherMembers = conversation.members.filter(
      (m) => m.userId !== userId,
    );

    const otherUsers =
      conversation.type === ConversationType.PRIVATE
        ? otherMembers.map(({ userId, avatarUrl, username, lastSeen }) => ({
            userId,
            avatarUrl,
            username,
            lastSeen,
          }))
        : otherMembers
            .slice(0, 3)
            .map(({ userId, avatarUrl, username, lastSeen }) => ({
              userId,
              avatarUrl,
              username,
              lastSeen,
            }));

    let isBlocked = false;
    if (
      conversation.type === ConversationType.PRIVATE &&
      otherMembers.length > 0
    ) {
      const otherUserId = otherMembers[0].userId;
      const blockResult = await this.followClient.isBlocked(
        userId,
        otherUserId,
      );
      isBlocked = blockResult.isBlocked;
    }

    const { members, ...conversationWithoutMembers } = conversation;

    return { ...conversationWithoutMembers, otherUsers, isBlocked };
  }

  async getOrCreatePrivateConversation(userBId: string) {
    const userAId = this.context.getUserId();

    const conversation = await this.findPrivateConversation(userBId);

    if (conversation) {
      return await this.findOne(conversation.id);
    }

    const newConversation = await this.create({
      memberIds: [userAId, userBId],
    });

    const res = await this.findOne(newConversation.id);
    const block = await this.followClient.isBlocked(userAId, userBId);
    return {
      ...res,
      isBlocked: block.isBlocked,
    };
  }

  async findAll(page = 1, limit = 20) {
    const userId = this.context.getUserId();
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const qb = this.conversationRepo
      .createQueryBuilder('c')
      .innerJoin(
        'c.members',
        'cm',
        'cm.userId = :userId AND cm.deletedAt IS NULL',
        { userId },
      )
      .leftJoinAndSelect(
        'c.messages',
        'm',
        `m.id = (
        SELECT m2.id FROM messages m2
        WHERE m2.conversationId = c.id AND m2.deletedAt IS NULL
        ORDER BY m2.createdAt DESC LIMIT 1
      )`,
      )
      .leftJoinAndSelect(
        'c.members',
        'allMembers',
        'allMembers.deletedAt IS NULL',
      )
      .addSelect('COALESCE(m.createdAt, c.createdAt)', 'lastActivity')
      .orderBy('lastActivity', 'DESC')
      .skip(skip)
      .take(limit);

    const [conversations, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      content: conversations.map((c: Conversation) => {
        const lastMessage = c.messages?.[0] || null;
        const otherMembers = c.members.filter((m) => m.userId !== userId);

        const otherUsers = (
          c.type === ConversationType.PRIVATE
            ? otherMembers.slice(0, 1)
            : otherMembers.slice(0, 3)
        ).map(({ userId, avatarUrl, username, lastSeen }) => ({
          userId,
          avatarUrl,
          username,
          lastSeen,
        }));

        const currentMember = c.members.find((m) => m.userId === userId);
        const isRead = !lastMessage
          ? true
          : !currentMember?.lastSeenMessageId
            ? false
            : currentMember.lastSeenMessageId >= lastMessage.id;

        const { members, messages, ...rest } = c as any;
        return { ...rest, lastMessage, otherUsers, isRead };
      }),
      total,
      page: safePage,
      limit,
      totalPages,
      hasNext: safePage < totalPages,
    };
  }
}
