import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeTargetType } from 'src/enums/ContentType';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Like')
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLikeDto: CreateLikeDto) {
    return this.likeService.create(createLikeDto);
  }

  @Get('target')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  @ApiQuery({
    name: 'type',
    enum: LikeTargetType,
    enumName: 'LikeTargetType',
    required: true,
  })
  findByTarget(
    @Query('targetId', ParseIntPipe) targetId: number,
    @Query('targetType', new ParseEnumPipe(LikeTargetType))
    type: LikeTargetType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    return this.likeService.findByTarget(targetId, type, page, size);
  }

  @Delete()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Query('targetId', ParseIntPipe) targetId: number,
    @Query('targetType', new ParseEnumPipe(LikeTargetType))
    targetType: LikeTargetType,
  ) {
    return this.likeService.remove(targetId, targetType);
  }

  @EventPattern('comment.likes.remove')
  async handleRemoveCommentLikes(
    @Payload()
    data: {
      targetIds: number[];
      targetType: LikeTargetType;
    },
  ) {
    await this.likeService.removeByTargetIds(data.targetIds, data.targetType);
  }
}
