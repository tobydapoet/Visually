import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCollabDto } from './dto/create-collab.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Collab } from './entities/collab.entity';
import { In, Repository } from 'typeorm';
import { ContentType } from 'src/enums/content.type';
import { CollabStatus } from 'src/enums/collab_status.type';
import { UserClient } from 'src/client/user.client';

@Injectable()
export class CollabService {
  constructor(
    @InjectRepository(Collab) private collabRepo: Repository<Collab>,
    private userClient: UserClient,
  ) {}
  async createMany(createCollabDto: CreateCollabDto): Promise<Collab[]> {
    const { targetId, type, userIds } = createCollabDto;

    const existingTags = await this.collabRepo.find({
      where: {
        targetId,
        type,
        userId: In(userIds),
      },
    });

    const userInfos = await this.userClient.getBatchUsers(userIds.join(','));

    if (existingTags.length > 0) {
      const duplicates = existingTags.map((t) => t.userId).join(', ');
      throw new ConflictException(`Collabs already exist: ${duplicates}`);
    }

    const collabs = userInfos.map((user) =>
      this.collabRepo.create({
        targetId,
        type,
        userId: user.id,
        avatarUrl: user.avatar,
        username: user.username,
      }),
    );

    return await this.collabRepo.save(collabs);
  }

  async findByTargetId(targetId: number, type: ContentType) {
    return this.collabRepo.find({ where: { targetId, type } });
  }

  async acceptCollab(targetId: number, type: ContentType) {
    const collab = await this.collabRepo.findOne({
      where: { targetId, type },
    });

    if (!collab) {
      throw new NotFoundException(
        `Collab not found with targetId=${targetId} and type=${type}`,
      );
    }

    collab.status = CollabStatus.APPROVED;
    return this.collabRepo.save(collab);
  }

  async removeCollab(targetId: number, type: ContentType) {
    const collab = await this.collabRepo.findOne({
      where: { targetId, type },
    });

    if (!collab) {
      throw new NotFoundException(
        `Collab not found with targetId=${targetId} and type=${type}`,
      );
    }

    return this.collabRepo.delete(collab);
  }
}
