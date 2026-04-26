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
} from '@nestjs/common';
import { ShortService } from './short.service';
import {
  CreateShortDto,
  CreateShortMultipartDto,
} from './dto/create-short.dto';
import { UpdateShortDto } from './dto/update-short.dto';
import { ContentStatus } from 'src/enums/content_status.type';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ShortResponsePageDto } from './dto/response-page-short';
import { ShortResponseDto } from './dto/response-short.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ContentManagePageReponse,
  DefaultReponseDto,
} from 'src/repost/dto/respose-default.dto';

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
    @Body() body: { status: ContentStatus },
  ) {
    const savedShort = await this.shortService.updateStatus(
      shortId,
      body.status,
    );
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

  @Get('status/:status')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  async searchPostWithStatus(
    @Param('status') status: ContentStatus,
    @Query('keyword') keyword?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ): Promise<ContentManagePageReponse> {
    return this.shortService.getByStatus(status, page, size, keyword);
  }

  @Get('batch')
  async getManyByIds(
    @Query('ids') ids: number[],
  ): Promise<DefaultReponseDto[]> {
    return await this.shortService.findManyByIds(ids);
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

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.shortService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
