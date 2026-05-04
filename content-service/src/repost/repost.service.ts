import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repost } from './entities/repost.entity';
import { In, Repository } from 'typeorm';
import { PostService } from 'src/post/post.service';
import { ShortService } from 'src/short/short.service';
import { ContextService } from 'src/context/context.service';
import { ContentType } from 'src/enums/content.type';
import { RepostReqDto } from './dto/create-repost.dto';
import { InteractionType } from 'src/enums/interaction.type';
import { DefaultReponseDto } from './dto/respose-default.dto';
import { UserRole } from 'src/enums/user_role.type';

@Injectable()
export class RepostService {
  constructor(
    @InjectRepository(Repost) private repostRepo: Repository<Repost>,
    private postService: PostService,
    private shortService: ShortService,
    private context: ContextService,
  ) {}
  async create(createRepostDto: RepostReqDto) {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    const existing = await this.repostRepo.findOne({
      where: {
        userId,
        originalId: createRepostDto.originalId,
        originalType: createRepostDto.originalType,
      },
    });

    if (existing) return { reposted: true };

    const newRepost = this.repostRepo.create({
      userId,
      username,
      avatarUrl,
      originalId: createRepostDto.originalId,
      originalType: createRepostDto.originalType,
    });

    await this.repostRepo.save(newRepost);

    if (createRepostDto.originalType === ContentType.POST) {
      await this.postService.updateInteraction(
        createRepostDto.originalId,
        InteractionType.REPOST,
      );
    } else if (createRepostDto.originalType === ContentType.SHORT) {
      await this.shortService.updateInteraction(
        createRepostDto.originalId,
        InteractionType.REPOST,
      );
    }

    return { reposted: true };
  }

  async findOne(id: number) {
    const existing = await this.repostRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Can't find this repost");
    }

    let content;
    if (existing.originalType === ContentType.POST) {
      content = await this.postService.findOneWithUrl(existing.originalId);
    } else if (existing.originalType === ContentType.SHORT) {
      content = await this.shortService.findOneWithUrl(existing.originalId);
    }

    if (!content) {
      throw new NotFoundException('Original content not found');
    }

    return {
      ...content,
      isRepost: true,
      repostedBy: {
        id: existing.id,
        userId: existing.userId,
        username: existing.username,
        avatarUrl: existing.avatarUrl,
      },
    };
  }

  async findRepostByTargetIds(ids: number[], type: ContentType) {
    const userId = this.context.getUserId();
    return this.repostRepo.find({
      where: {
        userId,
        originalId: In(ids),
        originalType: type,
      },
    });
  }

  async findByUser(userId: string, page = 1, size = 10) {
    const [reposts, total] = await this.repostRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    if (reposts.length === 0) return { content: [], page, size, total };

    const postIds = reposts
      .filter((r) => r.originalType === ContentType.POST)
      .map((r) => r.originalId);

    const shortIds = reposts
      .filter((r) => r.originalType === ContentType.SHORT)
      .map((r) => r.originalId);

    const [posts, shorts] = await Promise.all([
      postIds.length > 0
        ? this.postService.findManyByIds(postIds)
        : ([] as DefaultReponseDto[]),
      shortIds.length > 0
        ? this.shortService.findManyByIds(shortIds)
        : ([] as DefaultReponseDto[]),
    ]);

    const postMap = new Map<number, (typeof posts)[0]>();
    posts.forEach((p) => postMap.set(p.id, p));

    const shortMap = new Map<number, (typeof shorts)[0]>();
    shorts.forEach((s) => shortMap.set(s.id, s));

    const content = reposts
      .map((repost) => {
        const original =
          repost.originalType === ContentType.POST
            ? postMap.get(repost.originalId)
            : shortMap.get(repost.originalId);

        if (!original) return null;

        return {
          ...original,
          originalType: repost.originalType,
        };
      })
      .filter(Boolean);

    return { content, page, size, total };
  }

  async remove(dto: RepostReqDto) {
    const userId = this.context.getUserId();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }
    await this.repostRepo.delete({
      userId,
      originalId: dto.originalId,
      originalType: dto.originalType,
    });

    if (dto.originalType === ContentType.POST) {
      await this.postService.updateInteraction(
        dto.originalId,
        InteractionType.UNREPOST,
      );
    } else if (dto.originalType === ContentType.SHORT) {
      await this.shortService.updateInteraction(
        dto.originalId,
        InteractionType.UNREPOST,
      );
    }
  }
}
