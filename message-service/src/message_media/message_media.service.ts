import { Injectable } from '@nestjs/common';
import { CreateMessageMediaDto } from './dto/create-message_media.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageMedia } from './entities/message_media.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class MessageMediaService {
  constructor(
    @InjectRepository(MessageMedia) private mediaRepo: Repository<MessageMedia>,
  ) {}
  async createMany(dtos: CreateMessageMediaDto[], manager: EntityManager) {
    const entities = this.mediaRepo.create(dtos);
    return manager.save(MessageMedia, entities);
  }

  async findByConversation(conversationId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [mediaList, total] = await this.mediaRepo.findAndCount({
      where: {
        message: {
          conversation: {
            id: conversationId,
          },
        },
      },
      relations: ['message'],
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      data: mediaList,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
