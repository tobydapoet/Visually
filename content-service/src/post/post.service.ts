import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { DataSource, In, Repository } from 'typeorm';
import { PostMediaService } from 'src/post_media/post_media.service';
import { ContentStatus } from 'src/enums/content_status.type';
import { UserRole } from 'src/enums/user_role.type';
import { TagService } from 'src/tag/tag.service';
import { ContentType } from 'src/enums/content.type';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/response-post.dto';
import { CollabService } from 'src/collab/collab.service';
import { PostResponsePageDto } from './dto/response-page-post.dto';
import { MediaClient } from 'src/client/media.client';
import { ContextService } from 'src/context/context.service';
import { InteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { Tag } from 'src/tag/entities/tag.entity';

@Injectable()
export class PostService {
  private logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private postMediaService: PostMediaService,
    private readonly mediaClient: MediaClient,
    private context: ContextService,
    private tagService: TagService,
    private collabService: CollabService,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
  ): Promise<Post> {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();

    if (!files) {
      throw new NotFoundException('file cannot be empty!');
    }

    const mediaResponses = await this.mediaClient.upload(files, 'post', userId);

    let musicUrl: string | null = null;
    if (createPostDto.musicId) {
      const musicResponse = await this.mediaClient.getMusic(
        userId,
        createPostDto.musicId,
      );
      musicUrl = musicResponse.url;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const post = queryRunner.manager.create(Post, {
        caption: createPostDto.caption,
        userId,
        avatarUrl,
        username,
        musicId: createPostDto.musicId ?? null,
        musicUrl,
      });

      const savedPost = await queryRunner.manager.save(post);

      await this.postMediaService.createMany(
        mediaResponses,
        savedPost.id,
        queryRunner.manager,
      );

      let tags: Tag[] = [];

      if (createPostDto.tagsName) {
        const names = Array.isArray(createPostDto.tagsName)
          ? createPostDto.tagsName
          : [createPostDto.tagsName];

        tags = await this.tagService.createMany({
          names,
          targetId: savedPost.id,
          type: ContentType.POST,
        });
      }

      if (createPostDto.collabUserId) {
        await this.collabService.createMany({
          userIds: createPostDto.collabUserId,
          targetId: savedPost.id,
          type: ContentType.POST,
        });
      }

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: savedPost.id,
          authorId: savedPost.userId,
          type: 'POST',
          username,
          avatarUrl,
          createdAt: savedPost.createdAt,
          tags: tags.map((tag) => tag.name),
        },
      });

      await queryRunner.commitTransaction();

      return savedPost;
    } catch (error) {
      this.logger.error('Create post failed', error);

      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      try {
        await this.mediaClient.delete(
          userId,
          mediaResponses.map((media) => media.id),
        );
      } catch (cleanupError) {
        this.logger.error('Failed to cleanup media', cleanupError);
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(postId: number, status: ContentStatus): Promise<Post> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentPost = await queryRunner.manager.findOne(Post, {
        where: { id: postId },
      });

      if (!currentPost) {
        throw new NotFoundException(`Post not found!`);
      }

      const roles = this.context.getRoles();
      const userId = this.context.getUserId();

      const isAdmin = roles.includes(UserRole.ADMIN);
      const isModerator = roles.includes(UserRole.MODERATOR);
      const isOwner = userId === currentPost.userId;

      if (!isAdmin && !isModerator && status === ContentStatus.BANNED) {
        throw new ForbiddenException(
          "You don't have permission to do this action!",
        );
      }

      if (!isAdmin && !isModerator && !isOwner) {
        throw new UnauthorizedException(
          "You don't have permission to do this action!",
        );
      }

      currentPost.status = status;

      const savedPost = await queryRunner.manager.save(currentPost);

      await this.outboxEventService.updateStatus(queryRunner.manager, {
        eventType: 'content.status.updated',
        payload: {
          contentId: savedPost.id,
          status: savedPost.status,
          type: 'POST',
        },
      });

      await queryRunner.commitTransaction();

      return savedPost;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to update status', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateInteraction(postId: number, action: InteractionType) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post not found!`);
    }
    switch (action) {
      case InteractionType.COMMENT:
        post.commentCount += 1;
        break;
      case InteractionType.LIKE:
        post.likeCount += 1;
        break;
      case InteractionType.SHARE:
        post.shareCount += 1;
        break;
      case InteractionType.UNLIKE:
        if (post.likeCount > 0) {
          post.likeCount -= 1;
        }
        break;
      case InteractionType.UNSHARE:
        if (post.shareCount > 0) {
          post.shareCount -= 1;
        }
        break;
      default:
        break;
    }
    await this.postRepo.save(post);
  }

  async decreaseCommentInteraction(shortId: number, num: number) {
    const result = await this.postRepo.decrement(
      { id: shortId },
      'commentCount',
      num,
    );

    if (result.affected === 0) {
      throw new NotFoundException('Short not found!');
    }
  }

  async findByUser(
    userId: string,
    page = 1,
    size = 10,
  ): Promise<PostResponsePageDto> {
    const [posts, total] = await this.postRepo.findAndCount({
      where: { userId },
      relations: ['medias'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: posts.map((post) => ({
        id: post.id,
        caption: post.caption,
        userId: post.userId,
        avatarUrl: post.avatarUrl,
        username: post.username,
        mediaUrl: post.medias?.[0]?.mediaUrl,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
      })),
      page,
      size,
      total,
    };
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    const BATCH_SIZE = 100;
    let skip = 0;

    while (true) {
      const posts = await this.postRepo.find({
        where: { userId },
        select: ['id'],
        take: BATCH_SIZE,
        skip,
      });

      if (!posts.length) break;

      await this.postRepo.update(
        { id: In(posts.map((p) => p.id)) },
        { avatarUrl },
      );

      skip += BATCH_SIZE;
    }
  }

  async findOneWithUrl(postId: number): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post not found!`);
    }

    const tags = await this.tagService.findByTargetId(postId, ContentType.POST);

    return {
      id: postId,
      userId: post.userId,
      username: post.username,
      avatarUrl: post.avatarUrl,
      caption: post.caption,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      medias: (post.medias ?? []).map((media) => ({
        id: media.mediaId,
        url: media.mediaUrl,
      })),
      status: post.status,
      createdAt: post.createdAt,
      tags,
    };
  }

  async findOne(postId: number): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post not found!`);
    }
    return post;
  }

  async update(
    postId: number,
    updatePostto: Partial<UpdatePostDto>,
  ): Promise<Post> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentShort = await queryRunner.manager.findOne(Post, {
        where: { id: postId },
      });

      if (!currentShort) {
        throw new NotFoundException('Post not found');
      }

      const userId = this.context.getUserId();

      if (currentShort.userId !== userId) {
        throw new ForbiddenException(
          "You don't have permission to update this post",
        );
      }

      if (updatePostto.caption) {
        currentShort.caption = updatePostto.caption;
      }

      if (updatePostto.tagsIdRemove && updatePostto.tagsIdRemove.length > 0) {
        await this.tagService.removeMany(
          updatePostto.tagsIdRemove,
          queryRunner.manager,
        );
      }

      if (updatePostto.tagsNameAdd && updatePostto.tagsNameAdd.length > 0) {
        await this.tagService.createMany(
          {
            names: updatePostto.tagsNameAdd,
            targetId: currentShort.id,
            type: ContentType.POST,
          },
          queryRunner.manager,
        );
      }

      const savedShort = await queryRunner.manager.save(currentShort);

      if (updatePostto.caption) {
        await this.outboxEventService.create(queryRunner.manager, {
          eventType: 'content.updated',
          payload: {
            contentId: savedShort.id,
            authorId: savedShort.userId,
            type: 'POST',
            createdAt: savedShort.createdAt,
          },
        });
      }

      await queryRunner.commitTransaction();

      return savedShort;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async search(
    keyword: string,
    page = 1,
    size = 10,
  ): Promise<PostResponsePageDto> {
    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.tags', 'tag')
      .leftJoinAndSelect('post.medias', 'media')
      .select([
        'post.id',
        'post.caption',
        'post.userId',
        'post.username',
        'post.avatarUrl',
        'post.likeCount',
        'post.commentCount',
        'post.shareCount',
        'media.id',
        'media.url',
      ])
      .where('post.status = :status', {
        status: ContentStatus.ACTIVE,
      });

    if (keyword) {
      queryBuilder.andWhere(
        '(post.caption ILIKE :keyword OR tag.name ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [posts, total] = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .distinct(true)
      .getManyAndCount();

    const content = posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      userId: post.userId,
      username: post.username,
      avatarUrl: post.avatarUrl,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      mediaUrl: post.medias?.[0]?.mediaUrl || '',
    }));

    return {
      content,
      page,
      size,
      total,
    };
  }

  async delete(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const userId = this.context.getUserId();

    try {
      const post = await queryRunner.manager.findOne(Post, {
        where: { id },
      });

      if (!post) throw new NotFoundException('Post not found');

      if (post.userId !== userId) {
        throw new ForbiddenException();
      }
      await queryRunner.manager.update(
        Post,
        { id },
        { status: ContentStatus.DELETED },
      );

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.deleted',
        payload: {
          contentId: post.id,
          type: 'POST',
        },
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
