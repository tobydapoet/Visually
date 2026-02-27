import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Put,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ContentStatus } from 'src/enums/content_status.type';
import { PostResponsePageDto } from './dto/response-page-post.dto';
import { PostResponseDto } from './dto/response-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InteractionType } from 'src/enums/interaction.type';
import { ContentType } from 'src/enums/content.type';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10))
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const savedPost = await this.postService.create(createPostDto, files);

    if (!savedPost) {
      return {
        message: 'Create post failed!',
      };
    }

    const response = {
      id: savedPost.id,
      userId: savedPost.userId,
      username: savedPost.username,
      avatarUrl: savedPost.avatarUrl,
      caption: savedPost.caption,
      musicId: savedPost.musicId,

      medias: savedPost.medias?.map((m) => m.mediaUrl) || [],

      likeCount: savedPost.likeCount,
      commentCount: savedPost.commentCount,
      shareCount: savedPost.shareCount,
      status: savedPost.status,
      createdAt: savedPost.createdAt,
      updatedAt: savedPost.updatedAt,
    };

    return {
      message: 'Create post success!',
      data: response,
    };
  }

  @Put(':id/status')
  async changeStatus(
    @Param('id') postId: number,
    @Body() status: ContentStatus,
  ) {
    const savedPost = await this.postService.updateStatus(postId, status);
    if (savedPost) {
      return {
        message: 'Update post success!',
      };
    } else {
      return {
        message: 'Update post failed!',
      };
    }
  }

  @Put(':id')
  async updateCaption(
    @Body() updatePostDto: UpdatePostDto,
    @Param() id: number,
  ) {
    const savedPost = await this.postService.update(id, updatePostDto);
    if (savedPost) {
      return {
        message: 'Update post success!',
      };
    } else {
      return {
        message: 'Update post failed!',
      };
    }
  }

  @Get('search')
  async searchPost(
    @Query('caption') caption: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
  ): Promise<PostResponsePageDto> {
    const res = await this.postService.search(caption, page, size);
    return res;
  }

  @Get('user')
  async getByhUser(
    @Query('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
  ): Promise<PostResponsePageDto> {
    const res = await this.postService.findByUser(userId, page, size);
    return res;
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) postId: number,
  ): Promise<PostResponseDto> {
    return this.postService.findOneWithUrl(postId);
  }

  @Delete(':id')
  async deleteStory(@Param('id') id: number) {
    return this.postService.delete(id);
  }

  @EventPattern('content.liked')
  async handleContentLiked(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content liked:', data);

    if (data.contentType !== ContentType.SHORT) return;

    await this.postService.updateInteraction(
      data.contentId,
      InteractionType.LIKE,
    );
  }

  @EventPattern('content.unliked')
  async handleContentUnliked(
    @Payload()
    data: {
      contentId: number;
      userId: string;
      contentType: ContentType;
    },
  ) {
    console.log('📨 Content unliked:', data);

    if (data.contentType !== ContentType.SHORT) return;

    await this.postService.updateInteraction(
      data.contentId,
      InteractionType.UNLIKE,
    );
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

    if (data.contentType !== ContentType.SHORT) return;

    await this.postService.updateInteraction(
      data.contentId,
      InteractionType.COMMENT,
    );
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

    if (data.contentType !== ContentType.SHORT) return;

    await this.postService.decreaseCommentInteraction(data.contentId, data.num);
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

    if (data.contentType !== ContentType.SHORT) return;

    await this.postService.updateInteraction(
      data.contentId,
      InteractionType.SHARE,
    );
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

    if (data.contentType !== ContentType.SHORT) return;

    await this.postService.updateInteraction(
      data.contentId,
      InteractionType.UNSHARE,
    );
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.postService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
