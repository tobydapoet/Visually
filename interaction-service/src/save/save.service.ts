import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSaveDto } from './dto/create-save.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Save } from './entities/save.entity';
import { In, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { ClientKafka } from '@nestjs/microservices';
import { ContentType } from 'src/enums/ContentType';

@Injectable()
export class SaveService {
  constructor(
    @InjectRepository(Save) private saveRepo: Repository<Save>,
    private context: ContextService,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}
  async create(createSaveDto: CreateSaveDto) {
    const userId = this.context.getUserId();

    const existingSave = await this.saveRepo.findOne({
      where: {
        userId: userId,
        targetId: createSaveDto.targetId,
        targetType: createSaveDto.targetType,
      },
    });
    if (existingSave) {
      return { saved: true };
    }

    const newSave = this.saveRepo.create({
      userId,
      username: this.context.getUsername(),
      avatarUrl: this.context.getAvatarUrl(),
      targetId: createSaveDto.targetId,
      targetType: createSaveDto.targetType,
    });

    const savedSave = await this.saveRepo.save(newSave);
    this.kafkaClient.emit(`content.saved`, {
      contentId: createSaveDto.targetId,
      userId: this.context.getUserId(),
      contentType: savedSave.targetType,
    });

    this.kafkaClient.emit(`content.notification.saved`, {
      contentId: createSaveDto.targetId,
      actorId: this.context.getUserId(),
      actorName: this.context.getUsername(),
      actorAvatarUrl: this.context.getAvatarUrl(),
      contentType: savedSave.targetType,
      timestamp: new Date().toISOString(),
    });
    return { saved: true };
  }

  async findByUser(userId: string, page = 1, size = 10) {
    const [saves, total] = await this.saveRepo.findAndCount({
      where: {
        userId,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return {
      content: saves,
      meta: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const saves = await this.saveRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!saves.length) break;

      await this.saveRepo.update(
        { id: In(saves.map((p) => p.id)) },
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  async remove(targetId: number, targetType: ContentType) {
    const userId = this.context.getUserId();
    const existSave = await this.saveRepo.findOne({
      where: { targetId, targetType, userId },
    });
    if (existSave?.userId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to do this action",
      );
    }
    if (!existSave) {
      throw new NotFoundException('Save not found!');
    }
    const eventName = `content.unsaved`;
    this.kafkaClient.emit(eventName, {
      contentId: existSave.targetId,
      userId: this.context.getUserId(),
      contentType: existSave.targetType,
    });
    return this.saveRepo.delete(existSave.id);
  }

  async getSavedIds(
    userId: string,
    targetIds: number[],
    targetType: ContentType,
  ) {
    const saves = await this.saveRepo.find({
      where: { userId, targetId: In(targetIds), targetType },
      select: ['targetId'],
    });
    return saves.map((s) => s.targetId);
  }
}
