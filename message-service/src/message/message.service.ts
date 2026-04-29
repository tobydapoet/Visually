import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { MediaClient } from '../client/media.client';
import { MessageMediaService } from '../message_media/message_media.service';
import { ContextService } from '../context/context.service';
import { ClientKafka } from '@nestjs/microservices';
import { MediaResponse } from '../client/dto/MediaResponse.dto';
import { ConversationMember } from '../conversation_member/entities/conversation_member.entity';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MentionService } from '../mention/mention.service';
import { FollowClient } from '../client/follow.client';
import { Conversation } from '../conversation/entities/conversation.entity';
import { ConversationType } from '../enums/conversation.type';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private mediaClient: MediaClient,
    private messageMediaService: MessageMediaService,
    private context: ContextService,
    private dataSource: DataSource,
    private mentionService: MentionService,
    private followClient: FollowClient,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    files?: Express.Multer.File[],
  ) {
    const userId = this.context.getUserId();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const member = await queryRunner.manager.findOne(ConversationMember, {
      where: {
        userId: createMessageDto.senderId,
        conversation: { id: createMessageDto.conversationId },
      },
    });

    if (!member) {
      throw new Error('Sender is not a member of this conversation');
    }

    const conversation = await queryRunner.manager.findOne(Conversation, {
      where: { id: createMessageDto.conversationId },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException("Can't find this notification");
    }

    if (conversation?.type === ConversationType.PRIVATE) {
      const otherMember = conversation.members.find(
        (m) => m.userId !== createMessageDto.senderId,
      );

      if (otherMember) {
        const { isBlocked } = await this.followClient.isBlocked(
          createMessageDto.senderId,
          otherMember.userId,
        );

        if (isBlocked) {
          throw new ForbiddenException('Cannot send message to a blocked user');
        }
      }
    }

    try {
      const message = await queryRunner.manager.save(
        queryRunner.manager.create(Message, {
          conversation: { id: createMessageDto.conversationId },
          sender: { id: member.id },
          content: createMessageDto.content,
          ...(createMessageDto.replyToMessageId && {
            replyTo: { id: createMessageDto.replyToMessageId },
          }),
        }),
      );

      if (message && createMessageDto.mentions) {
        await this.mentionService.createMany(
          {
            mentions: createMessageDto.mentions,
            messageId: message.id,
          },
          queryRunner.manager,
        );
      }
      let mediaUrls: MediaResponse[] = [];

      if (files?.length) {
        const fileRes = await this.mediaClient.upload(files, userId);

        await this.messageMediaService.createMany(
          fileRes.map((item) => ({
            messageId: message.id,
            mediaId: item.id,
            url: item.url,
          })),
          queryRunner.manager,
        );

        mediaUrls = fileRes.map((item) => ({
          id: item.id,
          url: item.url,
        }));
      }

      let replyToData: {
        id: number;
        username?: string;
        content?: string;
        avatarUrl?: string | null;
        isDeleted?: boolean;
      } | null = null;

      if (createMessageDto.replyToMessageId) {
        const replyToMessage = await queryRunner.manager.findOne(Message, {
          where: { id: createMessageDto.replyToMessageId },
          withDeleted: true,
          relations: ['sender'],
        });

        if (replyToMessage) {
          if (replyToMessage.deletedAt) {
            replyToData = {
              id: replyToMessage.id,
              isDeleted: true,
              content: 'Original message was deleted',
            };
          } else {
            replyToData = {
              id: replyToMessage.id,
              username: replyToMessage.sender?.username,
              content: replyToMessage.content,
              avatarUrl: replyToMessage.sender?.avatarUrl || null,
            };
          }
        }
      }

      const mutedUserIds = conversation.members
        .filter((m) => {
          return (
            m.userId !== createMessageDto.senderId &&
            m.isMutedAt &&
            (!m.mutedUntil || m.mutedUntil > new Date())
          );
        })
        .map((m) => m.userId);

      const memberIds = conversation.members.map((m) => m.userId);

      this.kafkaClient.emit('message.created', {
        key: createMessageDto.conversationId,
        value: {
          id: message.id,
          conversationId: createMessageDto.conversationId,
          senderId: createMessageDto.senderId,
          content: createMessageDto.content,
          replyToId: replyToData ?? null,
          createdAt: message.createdAt,
          mentions: createMessageDto.mentions?.map((mention) => ({
            userId: mention.userId,
            username: mention.username,
          })),
          senderUsername: member.username,
          senderAvatar: member.avatarUrl,
          mediaUrls,
          memberIds,
          mutedUserIds,
        },
      });

      await queryRunner.commitTransaction();
      return message;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getLastMessage(conversationId: number) {
    return await this.messageRepo.findOne({
      where: {
        conversation: { id: conversationId },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByConversation(
    conversationId: number,
    page = 1,
    size = 20,
    keyword?: string,
  ) {
    const skip = (page - 1) * size;

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'member')
      .leftJoinAndSelect('m.medias', 'medias')
      .leftJoinAndSelect('m.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .leftJoinAndSelect('m.mentions', 'mentions')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.deletedAt IS NULL');

    if (keyword && keyword.trim() !== '') {
      qb.andWhere('LOWER(m.content) LIKE :keyword', {
        keyword: `%${keyword.toLowerCase()}%`,
      });
    }

    qb.orderBy('m.createdAt', 'DESC').skip(skip).take(size);

    const [messages, total] = await qb.getManyAndCount();

    return {
      content: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        senderId: m.sender?.userId,
        mentions: m.mentions?.map((mention) => ({
          userId: mention.userId,
          username: mention.username,
        })),
        replyTo:
          m.replyTo && !m.replyTo.deletedAt
            ? {
                id: m.replyTo.id,
                username: m.replyTo.sender?.username,
                content: m.replyTo.content,
                avatarUrl: m.replyTo.sender?.avatarUrl || null,
              }
            : m.replyTo
              ? {
                  id: m.replyTo.id,
                  isDeleted: true,
                  content: 'Original message was deleted',
                }
              : null,
        senderUsername: m.sender?.username,
        senderAvatar: m.sender?.avatarUrl,
        mediaUrls: m.medias?.map((media) => ({ url: media.url })) ?? [],
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
      hasNext: page < Math.ceil(total / size),
    };
  }

  async updateMessage(id: number, dto: UpdateMessageDto) {
    const userId = this.context.getUserId();

    const message = await this.messageRepo.findOne({
      where: { id, sender: { userId } },
      relations: ['conversation'],
    });

    if (!message) throw new NotFoundException('Message not found');

    await this.messageRepo.update(id, { content: dto.content });

    if (dto.mentions !== undefined) {
      await this.mentionService.updateMentions(id, dto.mentions);
    }

    const updatedMessage = { ...message, content: dto.content };

    this.kafkaClient.emit('message.updated', {
      key: message.conversation.id,
      value: {
        id: message.id,
        conversationId: message.conversation.id,
        content: dto.content,
      },
    });

    return updatedMessage;
  }

  async deleteMessage(id: number) {
    const userId = this.context.getUserId();

    const message = await this.messageRepo.findOne({
      where: { id, sender: { userId } },
      relations: ['conversation'],
    });

    if (!message) throw new NotFoundException('Message not found');

    await this.messageRepo.softDelete(id);

    this.kafkaClient.emit('message.deleted', {
      key: message.conversation.id,
      value: {
        id: message.id,
        conversationId: message.conversation.id,
      },
    });

    return { success: true };
  }
}
