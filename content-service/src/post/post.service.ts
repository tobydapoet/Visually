import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { PostMediaService } from 'src/post_media/post_media.service';
import { ContentStatus } from 'src/enums/content_status.type';
import { UserRole } from 'src/enums/user_role.type';
import { TagService } from 'src/tag/tag.service';
import { ContentServiceType, ContentType } from 'src/enums/content.type';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/response-post.dto';
import { PostResponsePageDto } from './dto/response-page-post.dto';
import { MediaClient } from 'src/client/media.client';
import { ContextService } from 'src/context/context.service';
import { InteractionType } from 'src/enums/interaction.type';
import { OutboxEventsService } from 'src/outbox_events/outbox_events.service';
import { Tag } from 'src/tag/entities/tag.entity';
import { MentionsService } from 'src/mention/mention.service';
import { InteractionClient } from 'src/client/interaction.client';
import { MentionResponse } from 'src/mention/dto/response-mentions.dto';
import {
  ContentManagePageReponse,
  DefaultReponseDto,
} from 'src/repost/dto/respose-default.dto';
import { Repost } from 'src/repost/entities/repost.entity';

@Injectable()
export class PostService {
  private logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Repost)
    private readonly repostRepo: Repository<Repost>,
    private postMediaService: PostMediaService,
    private readonly mediaClient: MediaClient,
    private context: ContextService,
    private tagService: TagService,
    private dataSource: DataSource,
    private outboxEventService: OutboxEventsService,
    private mentionService: MentionsService,
    private interactionClient: InteractionClient,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
  ): Promise<Post> {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();
    const role = this.context.getRole();

    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can perform this action');
    }

    if (!files) {
      throw new NotFoundException('file cannot be empty!');
    }

    const mediaResponses = await this.mediaClient.upload(files, 'post', userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const post = queryRunner.manager.create(Post, {
        caption: createPostDto.caption,
        userId,
        avatarUrl,
        username,
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

      if (createPostDto.mentions) {
        await this.mentionService.createMany(
          userId,
          createPostDto.mentions.map((m) => ({
            ...m,
            targetId: savedPost.id,
            type: ContentType.POST,
          })),
        );
      }

      await this.outboxEventService.create(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: savedPost.id,
          senderId: savedPost.userId,
          contentType: 'POST',
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

  async countUserPost(userId: string) {
    return this.postRepo.count({ where: { userId } });
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

      const role = this.context.getRole();
      const userId = this.context.getUserId();

      const isAdmin = role === UserRole.ADMIN;
      const isModerator = role === UserRole.MODERATOR;
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
      case InteractionType.SAVE:
        post.saveCount += 1;
        break;
      case InteractionType.DISLIKE:
        if (post.likeCount > 0) {
          post.likeCount -= 1;
        }
        break;
      case InteractionType.UNSAVE:
        if (post.saveCount > 0) {
          post.saveCount -= 1;
        }
        break;
      case InteractionType.REPOST:
        post.repostCount += 1;
        break;
      case InteractionType.UNREPOST:
        if (post.repostCount > 0) {
          post.repostCount -= 1;
        }
        break;
      default:
        break;
    }
    await this.postRepo.save(post);
  }

  async decreaseCommentInteraction(postId: number, num: number) {
    const result = await this.postRepo.decrement(
      { id: postId },
      'commentCount',
      num,
    );

    if (result.affected === 0) {
      throw new NotFoundException('Post not found!');
    }
  }

  async findManyByIds(ids: number[]): Promise<DefaultReponseDto[]> {
    const userId = this.context.getUserId();

    const [posts, allTags, allMentions, reposts] = await Promise.all([
      this.postRepo.find({
        where: { id: In(ids) },
        relations: ['medias'],
      }),
      this.tagService.findByTargetIds(ids, ContentType.POST),
      this.mentionService.findManyByTargetIds(ids, ContentType.POST),
      this.repostRepo.find({
        where: {
          userId,
          originalId: In(ids),
          originalType: ContentType.POST,
        },
      }),
    ]);

    const interactions = await this.interactionClient.getCurrentInteraction(
      userId,
      posts.map((post) => post.id),
      ContentServiceType.POST,
    );

    const interactionMap = new Map<number, (typeof interactions)[0]>();
    interactions.forEach((i) => interactionMap.set(i.targetId, i));

    const tagsMap = new Map<number, Tag[]>();
    allTags.forEach((tag) => {
      if (!tagsMap.has(tag.targetId)) tagsMap.set(tag.targetId, []);
      tagsMap.get(tag.targetId)!.push(tag);
    });

    const mentionsMap = new Map<number, MentionResponse[]>();
    allMentions.forEach((mention) => {
      if (!mentionsMap.has(mention.targetId))
        mentionsMap.set(mention.targetId, []);
      mentionsMap.get(mention.targetId)!.push(mention);
    });

    const repostedIds = new Set(reposts.map((r) => r.originalId));

    return posts.map((post) => {
      const interaction = interactionMap.get(post.id);
      return {
        id: post.id,
        caption: post.caption,
        userId: post.userId,
        username: post.username,
        avatarUrl: post.avatarUrl,
        thumbnailUrl: post.medias?.[0]?.mediaUrl,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        saveCount: post.saveCount,
        repostCount: post.repostCount,
        createdAt: post.createdAt,
        tags: tagsMap.get(post.id) ?? [],
        mentions: mentionsMap.get(post.id) ?? [],
        isLiked: interaction?.isLiked ?? false,
        isCommented: interaction?.isCommented ?? false,
        isSaved: interaction?.isSaved ?? false,
        isReposted: repostedIds.has(post.id),
      };
    });
  }

  async getByStatus(
    status: ContentStatus,
    page = 1,
    size = 10,
    keyword?: string,
  ): Promise<ContentManagePageReponse> {
    const whereCondition = keyword
      ? [
          { status, username: ILike(`%${keyword}%`) },
          { status, caption: ILike(`%${keyword}%`) },
        ]
      : { status };

    const [posts, total] = await this.postRepo.findAndCount({
      where: whereCondition,
      skip: (page - 1) * size,
      take: size,
      order: {
        createdAt: 'DESC',
      },
      relations: ['medias'],
    });

    const mentions = await this.mentionService.findManyByTargetIds(
      posts.map((post) => post.id),
      ContentType.POST,
    );

    const mentionMap = new Map<number, MentionResponse[]>();

    mentions.forEach((m) => {
      if (!mentionMap.has(m.targetId)) {
        mentionMap.set(m.targetId, []);
      }
      mentionMap.get(m.targetId)!.push(m);
    });

    return {
      content: posts.map((post) => {
        return {
          id: post.id,
          userId: post.userId,
          avatarUrl: post.avatarUrl,
          username: post.username,
          caption: post.caption,
          thumbnailUrl: post.medias?.[0]?.mediaUrl,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          mentions: (mentionMap.get(post.id) || []).map((m) => ({
            userId: m.userId,
            username: m.username,
          })),
        };
      }),
      total,
      page,
      size,
    };
  }

  async findByUser(
    userId: string,
    page = 1,
    size = 10,
  ): Promise<PostResponsePageDto> {
    const currentUserId = this.context.getUserId();
    const [posts, total] = await this.postRepo.findAndCount({
      where: { userId },
      relations: ['medias'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    const interactions = await this.interactionClient.getCurrentInteraction(
      currentUserId,
      posts.map((post) => post.id),
      ContentServiceType.POST,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return {
      content: posts.map((post) => {
        const interaction = interactionMap.get(post.id);
        return {
          id: post.id,
          caption: post.caption,
          userId: post.userId,
          avatarUrl: post.avatarUrl,
          username: post.username,
          mediaUrl: post.medias?.[0]?.mediaUrl,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          repostCount: post.repostCount,
          saveCount: post.saveCount,
          isLiked: interaction?.isLiked ?? false,
          isCommented: interaction?.isCommented ?? false,
          isSaved: interaction?.isSaved ?? false,
        };
      }),
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
    const userId = this.context.getUserId();

    const [post, tags, interaction, mentions, repost] = await Promise.all([
      this.postRepo.findOne({ where: { id: postId }, relations: ['medias'] }),
      this.tagService.findByTargetId(postId, ContentType.POST),
      this.interactionClient.getCurrentInteraction(
        userId,
        [postId],
        ContentServiceType.POST,
      ),
      this.mentionService.findMany(postId, ContentType.POST),
      this.repostRepo.findOne({
        where: { userId, originalId: postId, originalType: ContentType.POST },
      }),
    ]);

    if (!post) throw new NotFoundException(`Post not found!`);
    if (post.status === ContentStatus.DELETED)
      throw new NotFoundException('Post not available');

    return {
      id: postId,
      userId: post.userId,
      username: post.username,
      avatarUrl: post.avatarUrl,
      caption: post.caption,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      saveCount: post.saveCount,
      repostCount: post.repostCount,
      medias: (post.medias ?? []).map((media) => ({
        id: media.mediaId,
        url: media.mediaUrl,
      })),
      createdAt: post.createdAt,
      tags,
      mentions,
      isLiked: interaction[0]?.isLiked ?? false,
      isCommented: interaction[0]?.isCommented ?? false,
      isSaved: interaction[0]?.isSaved ?? false,
      isReposted: !!repost,
      status: post.status,
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
    updatePostDto: Partial<UpdatePostDto>,
  ): Promise<Post> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentPost = await queryRunner.manager.findOne(Post, {
        where: { id: postId },
      });

      if (!currentPost) {
        throw new NotFoundException('Post not found');
      }

      const userId = this.context.getUserId();

      if (currentPost.userId !== userId) {
        throw new ForbiddenException(
          "You don't have permission to update this post",
        );
      }

      if (updatePostDto.caption) {
        currentPost.caption = updatePostDto.caption;
      }

      if (updatePostDto.tagsIdRemove && updatePostDto.tagsIdRemove.length > 0) {
        await this.tagService.removeMany(
          updatePostDto.tagsIdRemove,
          queryRunner.manager,
        );
      }

      if (updatePostDto.tagsNameAdd && updatePostDto.tagsNameAdd.length > 0) {
        await this.tagService.createMany(
          {
            names: updatePostDto.tagsNameAdd,
            targetId: currentPost.id,
            type: ContentType.POST,
          },
          queryRunner.manager,
        );
      }

      if (updatePostDto.mentionAdd && updatePostDto.mentionAdd.length > 0) {
        await this.mentionService.createMany(
          userId,
          updatePostDto.mentionAdd.map((m) => ({
            ...m,
            targetId: postId,
            type: ContentType.POST,
          })),
        );
      }

      if (
        updatePostDto.mentionIdRemove &&
        updatePostDto.mentionIdRemove.length > 0
      ) {
        await this.mentionService.deleteMany(updatePostDto.mentionIdRemove);
      }

      const savedPost = await queryRunner.manager.save(currentPost);

      if (updatePostDto.caption) {
        await this.outboxEventService.create(queryRunner.manager, {
          eventType: 'content.updated',
          payload: {
            contentId: savedPost.id,
            senderId: savedPost.userId,
            contentType: 'POST',
            createdAt: savedPost.createdAt,
          },
        });
      }

      await queryRunner.commitTransaction();

      return savedPost;
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
    const userId = this.context.getUserId();
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
        'post.saveCount',
        'media.id',
        'media.url',
      ])
      .where('post.status = :status', { status: ContentStatus.ACTIVE });

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

    const interactions = await this.interactionClient.getCurrentInteraction(
      userId,
      posts.map((post) => post.id),
      ContentServiceType.POST,
    );

    const interactionMap = new Map(interactions.map((i) => [i.targetId, i]));

    return {
      content: posts.map((post) => {
        const interaction = interactionMap.get(post.id);
        return {
          id: post.id,
          caption: post.caption,
          userId: post.userId,
          username: post.username,
          avatarUrl: post.avatarUrl,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          saveCount: post.saveCount,
          repostCount: post.repostCount,
          mediaUrl: post.medias?.[0]?.mediaUrl || '',
          isLiked: interaction?.isLiked ?? false,
          isCommented: interaction?.isCommented ?? false,
          isSaved: interaction?.isSaved ?? false,
        };
      }),
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
          contentType: 'POST',
        },
      });

      await this.outboxEventService.delete(queryRunner.manager, {
        eventType: 'content.created',
        payload: {
          contentId: post.id,
          contentType: 'POST',
          timestamp: new Date().toISOString(),
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
