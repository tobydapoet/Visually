import { Controller, Get, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ContentServiceType, ContentType } from 'src/enums/content.type';
import {
  InteractionType,
  StoryInteractionType,
} from 'src/enums/interaction.type';
import { PostService } from 'src/post/post.service';
import { ShortService } from 'src/short/short.service';
import { StoryService } from 'src/story/story.service';

@Controller('content')
export class ContentController {
  constructor(
    private readonly postService: PostService,
    private readonly shortService: ShortService,
    private readonly storyService: StoryService,
  ) {}

  @Get(':userId')
  async getCount(@Param('userId') userId: string) {
    const postCount = await this.postService.countUserPost(userId);
    const shortCount = await this.shortService.countUserShort(userId);
    return {
      postCount,
      shortCount,
    };
  }

  @EventPattern('content.liked')
  async handleContentLiked(
    @Payload()
    data: {
      contentId: number;
      userId: string;
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

  @EventPattern('content.unliked')
  async handleContentUnliked(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentServiceType;
    },
  ) {
    console.log('📨 Content unliked:', data);

    try {
      switch (data.contentType) {
        case ContentServiceType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.UNLIKE,
          );
          break;

        case ContentServiceType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.UNLIKE,
          );
          break;
        case ContentServiceType.STORY:
          await this.storyService.updateInteraction(
            data.contentId,
            StoryInteractionType.UNLIKE,
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
      num: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content comment deleted:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.decreaseCommentInteraction(
            data.contentId,
            data.num,
          );

          break;

        case ContentType.SHORT:
          await this.shortService.decreaseCommentInteraction(
            data.contentId,
            data.num,
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

  @EventPattern('content.shared')
  async handleContentShared(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content shared:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.SHARE,
          );
          break;

        case ContentType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.SHARE,
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('handleContentShared error:', err);
    }
  }

  @EventPattern('content.unshared')
  async handleContentUnshared(
    @Payload()
    data: {
      contentId: number;
      shareId: number;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content unshared:', data);

    try {
      switch (data.contentType) {
        case ContentType.POST:
          await this.postService.updateInteraction(
            data.contentId,
            InteractionType.UNSHARE,
          );
          break;

        case ContentType.SHORT:
          await this.shortService.updateInteraction(
            data.contentId,
            InteractionType.UNSHARE,
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('handleContentUnShared error:', err);
    }
  }
}
