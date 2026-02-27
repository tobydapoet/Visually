import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { DataSource, Repository } from 'typeorm';
import { ConversationMemberService } from '../conversation_member/conversation_member.service';
import { ContextService } from '../context/context.service';
import { ConversationType } from '../enums/conversation.type';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    private memberService: ConversationMemberService,
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

  async findAll(page = 1, limit = 20, keyword?: string) {
    const userId = this.context.getUserId();
    const skip = (page - 1) * limit;

    const qb = this.conversationRepo
      .createQueryBuilder('c')

      .innerJoin('c.conversation_members', 'cm', 'cm.userId = :userId', {
        userId,
      })

      .leftJoinAndSelect(
        'c.messages',
        'm',
        `m.id = (
        SELECT m2.id
        FROM messages m2
        WHERE m2.conversationId = c.id
          AND m2.status = 'ACTIVE'
        ORDER BY m2.createdAt DESC
        LIMIT 1
      )`,
      ).andWhere(`
      cm.deletedAt IS NULL
      OR (
        m.createdAt IS NOT NULL
        AND m.createdAt > cm.deletedAt
      )
    `);

    if (keyword && keyword.trim() !== '') {
      qb.andWhere(
        `(LOWER(m.content) LIKE :keyword OR LOWER(c.name) LIKE :keyword)`,
        { keyword: `%${keyword.toLowerCase()}%` },
      );
    }

    qb.orderBy('m.createdAt', 'DESC', 'NULLS LAST');

    qb.skip(skip).take(limit);

    const [conversations, total] = await qb.getManyAndCount();

    return {
      data: conversations.map((c: any) => {
        const lastMessage = c.messages?.[0] || null;

        const isRead =
          !lastMessage || !c.conversation_members?.[0]?.lastSeenMessageId
            ? false
            : c.conversation_members[0].lastSeenMessageId >= lastMessage.id;

        return {
          ...c,
          lastMessage,
          isRead,
        };
      }),

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        keyword: keyword || null,
        isSearch: !!keyword,
      },
    };
  }

  findOne(id: number) {
    return this.conversationRepo.findOne({ where: { id } });
  }
}
