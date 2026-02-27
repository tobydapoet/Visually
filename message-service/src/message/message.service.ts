import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { DataSource, Repository } from 'typeorm';
import { AttachmentService } from '../attachment/attachment.service';
import { MediaClient } from '../client/media.client';
import { MessageMediaService } from '../message_media/message_media.service';
import { ContextService } from '../context/context.service';
import { MessageStatus } from '../enums/remove.type';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private attachmentService: AttachmentService,
    private mediaClient: MediaClient,
    private messageMediaService: MessageMediaService,
    private context: ContextService,
    private dataSource: DataSource,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}
  async create(
    createMessageDto: CreateMessageDto,
    files?: Express.Multer.File[],
  ) {
    const userId = this.context.getUserId();
    const sessionId = this.context.getSessionId();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const messageEntity = queryRunner.manager.create(Message, {
        conversationId: createMessageDto.conversationId,
        senderId: createMessageDto.senderId,
        content: createMessageDto.content,
        replyToId: createMessageDto.replyToMessgageId,
        forwardFromId: createMessageDto.forwardMesageId,
      });
      const message = await queryRunner.manager.save(messageEntity);
      if (createMessageDto.targetId && createMessageDto.targetType) {
        await this.attachmentService.create(
          {
            messageId: message.id,
            targetId: createMessageDto.targetId,
            targetType: createMessageDto.targetType,
          },
          queryRunner.manager,
        );
      }
      if (files && files.length > 0) {
        const fileRes = await this.mediaClient.upload(files, userId, sessionId);

        const mediaDtos = fileRes.map((item) => ({
          messageId: message.id,
          mediaId: item.id,
          url: item.url,
        }));

        await this.messageMediaService.createMany(
          mediaDtos,
          queryRunner.manager,
        );
      }
      this.kafkaClient.emit('message.created', {
        key: createMessageDto.conversationId,
        value: {
          messageId: message.id,
          conversationId: createMessageDto.conversationId,
          senderId: createMessageDto.senderId,
          content: createMessageDto.content,
          replyToId: createMessageDto.replyToMessgageId ?? null,
          forwardFromId: createMessageDto.forwardMesageId ?? null,
          createdAt: message.createdAt,
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

  async findByConversation(
    conversationId: number,
    page = 1,
    limit = 20,
    keyword?: string,
  ) {
    const skip = (page - 1) * limit;
    const userId = this.context.getUserId();

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.status = :active', { active: 'ACTIVE' })
      .andWhere('NOT (m.senderId = :userId AND m.status = :privateDelete)', {
        userId,
        privateDelete: 'DELETE_PRIVATE',
      });

    if (keyword && keyword.trim() !== '') {
      qb.andWhere('LOWER(m.content) LIKE :keyword', {
        keyword: `%${keyword.toLowerCase()}%`,
      });
    }

    qb.orderBy('m.createdAt', 'DESC').skip(skip).take(limit);

    const [messages, total] = await qb.getManyAndCount();

    return {
      data: messages,
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

  update(id: number, content: string) {
    return this.messageRepo.update({ id }, { content });
  }

  removePrivate(id: number) {
    return this.messageRepo.update(
      { id },
      { status: MessageStatus.DELETE_PRIVATE },
    );
  }

  removeWithAll(id: number) {
    return this.messageRepo.update(
      { id },
      { status: MessageStatus.DEELTE_ALL },
    );
  }
}
