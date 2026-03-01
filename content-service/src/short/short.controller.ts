import {
  Controller,
  Get,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Put,
  Post,
  Delete,
} from '@nestjs/common';
import { ShortService } from './short.service';
import {
  CreateShortDto,
  CreateShortMultipartDto,
} from './dto/create-short.dto';
import { UpdateShortDto } from './dto/update-short.dto';
import { ContentStatus } from 'src/enums/content_status.type';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ShortResponsePageDto } from './dto/response-page-short';
import { ShortResponseDto } from './dto/response-short.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ContentType } from 'src/enums/content.type';
import { InteractionType } from 'src/enums/interaction.type';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Short')
@Controller('short')
export class ShortController {
  constructor(private readonly shortService: ShortService) {}

  @Post()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateShortMultipartDto })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'fileVideo', maxCount: 1 },
      { name: 'fileThumbnail', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createShortDto: CreateShortDto,
    @UploadedFiles()
    files: {
      fileVideo?: Express.Multer.File[];
      fileThumbnail?: Express.Multer.File[];
    },
  ) {
    const fileVideo = files.fileVideo?.[0];
    const fileThumbnail = files.fileThumbnail?.[0];

    const savedShort = await this.shortService.create(
      createShortDto,
      fileVideo!,
      fileThumbnail!,
    );

    return savedShort
      ? { message: 'Create short success!', data: savedShort }
      : { message: 'Create short failed!' };
  }

  @ApiBearerAuth()
  @ApiOperation({
    description:
      'với status banned sẽ chỉ áp dụng nếu là admin hoặc moderator, chủ sở hữu có thể xóa',
  })
  @Put(':id/status')
  @ApiBody({
    schema: {
      type: 'enum',
      enum: Object.values(ContentStatus),
    },
  })
  async changeStatus(
    @Param('id') shortId: number,
    @Body() status: ContentStatus,
  ) {
    const savedShort = await this.shortService.updateStatus(shortId, status);
    if (savedShort) {
      return {
        message: 'Update short success!',
      };
    } else {
      return {
        message: 'Update short failed!',
      };
    }
  }

  @ApiBearerAuth()
  @Put(':id')
  async update(@Body() updateShortDto: UpdateShortDto, @Param() id: number) {
    const savedShort = await this.shortService.update(id, updateShortDto);
    if (savedShort) {
      return {
        message: 'Update short success!',
      };
    } else {
      return {
        message: 'Update short failed!',
      };
    }
  }

  @Get('search')
  async searchShort(
    @Query('caption') caption: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
  ): Promise<ShortResponsePageDto> {
    const res = await this.shortService.search(caption, page, size);
    return res;
  }

  @Get('user')
  async getByhUser(
    @Query('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size: number,
  ): Promise<ShortResponsePageDto> {
    const res = await this.shortService.findByUser(userId, page, size);
    return res;
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) shortId: number,
  ): Promise<ShortResponseDto> {
    return this.shortService.findOneWithUrl(shortId);
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

    if (data.contentType !== ContentType.POST) return;

    await this.shortService.updateInteraction(
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

    if (data.contentType !== ContentType.POST) return;

    await this.shortService.updateInteraction(
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

    if (data.contentType !== ContentType.POST) return;

    await this.shortService.updateInteraction(
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

    if (data.contentType !== ContentType.POST) return;

    await this.shortService.decreaseCommentInteraction(
      data.contentId,
      data.num,
    );
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

    if (data.contentType !== ContentType.POST) return;

    await this.shortService.updateInteraction(
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

    if (data.contentType !== ContentType.POST) return;

    await this.shortService.updateInteraction(
      data.contentId,
      InteractionType.UNSHARE,
    );
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.shortService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
