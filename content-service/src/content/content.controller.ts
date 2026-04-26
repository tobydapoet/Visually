import {
  ConflictException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ContentServiceType, ContentType } from 'src/enums/content.type';
import {
  InteractionType,
  StoryInteractionType,
} from 'src/enums/interaction.type';
import { PostService } from 'src/post/post.service';
import {
  DefaultReponseDto,
  FeedReponseDto,
} from 'src/repost/dto/respose-default.dto';
import { ShortService } from 'src/short/short.service';
import { StoryService } from 'src/story/story.service';
import { ContentService } from './content.service';
import { FeedContentPageResponse } from './dto/response-feed.dto';

@Controller('content')
export class ContentController {
  constructor(
    private readonly postService: PostService,
    private readonly shortService: ShortService,
    private readonly storyService: StoryService,
    private readonly contentService: ContentService,
  ) {}

  @Get('/target')
  async getContent(
    @Query('contentId', ParseIntPipe) contentId: number,
    @Query('contentType') contentType: ContentType,
  ): Promise<DefaultReponseDto> {
    if (contentType === ContentType.POST) {
      return this.postService.findOneWithUrl(contentId);
    } else if (contentType === ContentType.SHORT) {
      return this.shortService.findOneWithUrl(contentId);
    } else {
      throw new ConflictException("Can't find this type");
    }
  }

  @Get('feed')
  async searchFeedContent(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size = 20,
    @Query('tags') tags: string[],
  ): Promise<FeedReponseDto[]> {
    console.log('TAGS : ', tags);
    try {
      const res = await this.contentService.searchFeedContent(size, page, tags);
      console.log('RES: ', res);
      return res;
    } catch (err) {
      console.error('ERROR: ', err);
      throw err;
    }
  }

  @Get('search')
  searchContent(
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size = 20,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('tag') tag?: string,
    @Query('caption') caption?: string,
  ) {
    return this.contentService.searchContent(size, page, tag, caption);
  }

  @Get('recent/:userId')
  async getRecentContentByUserId(
    @Param('userId') userId: string,
  ): Promise<FeedReponseDto[]> {
    return this.contentService.getRecentContentByUserId(userId);
  }

  @Get(':type/feed')
  getFeedContent(
    @Param('type') type: 'home' | 'reel',
    @Query('cursor') cursor?: string,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take = 20,
  ): Promise<FeedContentPageResponse> {
    return this.contentService.getFeedContent(
      type.toUpperCase() as 'HOME' | 'REEL',
      cursor,
      take,
    );
  }

  @Get(':userId')
  async getCount(@Param('userId') userId: string) {
    const postCount = await this.postService.countUserPost(userId);
    const shortCount = await this.shortService.countUserShort(userId);
    const hasNewStory = await this.storyService.haveNonExpiredStory(userId);
    return {
      postCount,
      shortCount,
      hasNewStory,
    };
  }

  @EventPattern('content.liked')
  async handleContentLiked(
    @Payload()
    data: {
      contentId: number;
      contentType: ContentServiceType;
    },
  ) {
    console.log('📨 Content liked:', data);

    try {
      switch (data.contentType) {
        case ContentServiceType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.LIKE,
          );
          break;
        case ContentServiceType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.LIKE,
          );
        case ContentServiceType.STORY:
          await this.storyService.updateInteraction(
            data.contentId,
            StoryInteractionType.LIKE,
          );
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error('handleContentLiked error:', err.message);
    }
  }

  @EventPattern('content.disliked')
  async handleContentUnliked(
    @Payload()
    data: {
      contentId: number;
      contentType: ContentServiceType;
    },
  ) {
    console.log('📨 Content disliked:', data);

    try {
      switch (data.contentType) {
        case ContentServiceType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.DISLIKE,
          );
          break;

        case ContentServiceType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.DISLIKE,
          );
          break;
        case ContentServiceType.STORY:
          await this.storyService.updateInteraction(
            data.contentId,
            StoryInteractionType.DISLIKE,
          );
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('handleContentDisliked error:', err);
    }
  }

  @EventPattern('content.commented')
  async handleContentCommented(
    @Payload()
    data: {
      contentId: number;
      commentId: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content commented:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.COMMENT,
          );
          break;

        case ContentType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.COMMENT,
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('handleContentCommented error:', err);
    }
  }

  @EventPattern('content.comment_deleted')
  async handleContentCommentDeleted(
    @Payload()
    data: {
      contentId: number;
      deletedCount: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content comment deleted:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.decreaseCommentInteraction(
            data.contentId,
            data.deletedCount,
          );

          break;

        case ContentType.SHORT:
          await this.shortService.decreaseCommentInteraction(
            data.contentId,
            data.deletedCount,
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('handleContentDeleteCommented error:', err);
    }

    if (data.contentType !== ContentType.SHORT) return;
  }

  @EventPattern('content.saved')
  async handleContentSaved(
    @Payload()
    data: {
      contentId: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content saved:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.SAVE,
          );
          break;

        case ContentType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.SAVE,
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('handleContentSaved error:', err);
    }
  }

  @EventPattern('content.unsaved')
  async handleContentsaved(
    @Payload()
    data: {
      contentId: number;
      saveId: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content unsaved:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.UNSAVE,
          );
          break;

        case ContentType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.UNSAVE,
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('handleContentUnSaved error:', err);
    }
  }
}
