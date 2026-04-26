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
import { CreatePostDto, CreatePostMultipartDto } from './dto/create-post.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ContentStatus } from 'src/enums/content_status.type';
import { PostResponsePageDto } from './dto/response-page-post.dto';
import { PostResponseDto } from './dto/response-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ContentManagePageReponse,
  DefaultReponseDto,
} from 'src/repost/dto/respose-default.dto';

@ApiTags('Post')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePostMultipartDto })
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

      medias: savedPost.medias?.map((m) => m.mediaUrl) || [],

      likeCount: savedPost.likeCount,
      commentCount: savedPost.commentCount,
      saveCount: savedPost.saveCount,
      repostCount: savedPost.repostCount,

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
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'enum',
      enum: Object.values(ContentStatus),
    },
  })
  async changeStatus(
    @Param('id') postId: number,
    @Body() body: { status: ContentStatus },
  ) {
    const savedPost = await this.postService.updateStatus(postId, body.status);
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

  @ApiBearerAuth()
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
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  async searchPost(
    @Query('caption') caption: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ): Promise<PostResponsePageDto> {
    const res = await this.postService.search(caption, page, size);
    return res;
  }

  @Get('status/:status')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  async searchPostWithStatus(
    @Param('status') status: ContentStatus,
    @Query('keyword') keyword?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ): Promise<ContentManagePageReponse> {
    return this.postService.getByStatus(status, page, size, keyword);
  }

  @Get('batch')
  async getManyByIds(
    @Query('ids') ids: number[],
  ): Promise<DefaultReponseDto[]> {
    return await this.postService.findManyByIds(ids);
  }

  @Get('user')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  async getByUser(
    @Query('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
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

  @ApiBearerAuth()
  @Delete(':id')
  async deleteStory(@Param('id') id: number) {
    return this.postService.delete(id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.postService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
