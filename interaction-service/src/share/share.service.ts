import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateShareDto } from './dto/create-share.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { In, Repository } from 'typeorm';
import { ContextService } from 'src/context/context.service';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(Share) private shareRepo: Repository<Share>,
    private context: ContextService,
    @Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka,
  ) {}
  async create(createShareDto: CreateShareDto, userId: string) {
    const newShare = this.shareRepo.create({
      userId,
      username: this.context.getUsername(),
      avatarUrl: this.context.getAvatarUrl(),
      targetId: createShareDto.targetId,
      targetType: createShareDto.targetType,
      isPublic: createShareDto.isPublic ? createShareDto.isPublic : true,
    });
    const savedShare = await this.shareRepo.save(newShare);
    this.kafkaClient.emit(`content.shared`, {
      contentId: createShareDto.targetId,
      userId: this.context.getUserId(),
      contentType: savedShare.targetType,
    });

    this.kafkaClient.emit(`content.notification.shared`, {
      contentId: createShareDto.targetId,
      actorId: this.context.getUserId(),
      actorName: this.context.getUsername(),
      actorAvatarUrl: this.context.getAvatarUrl(),
      contentType: savedShare.targetType,
      timestamp: new Date().toISOString(),
    });
    return savedShare;
  }

  async findByUser(userId: string, page = 1, size = 10) {
    const [shares, total] = await this.shareRepo.findAndCount({
      where: {
        userId,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return {
      content: shares,
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
      const shares = await this.shareRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!shares.length) break;

      await this.shareRepo.update(
        { id: In(shares.map((p) => p.id)) },
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  async togglePublic(id: number) {
    const share = await this.shareRepo.findOne({ where: { id } });
    if (!share) {
      throw new NotFoundException(`You haven't saved yet!`);
    }
    share.isPublic = !share.isPublic;
    return this.shareRepo.save(share);
  }

  async remove(userId: string, id: number) {
    const share = await this.shareRepo.findOne({ where: { id } });
    if (share?.userId !== userId) {
      throw new ForbiddenException(
        "You don't have permission to do this action",
      );
    }
    if (!share) {
      throw new NotFoundException('Share not found!');
    }
    const eventName = `content.unshared`;
    this.kafkaClient.emit(eventName, {
      contentId: share.targetId,
      userId: this.context.getUserId(),
      contentType: share.targetType,
    });
    return this.shareRepo.delete(id);
  }
}
