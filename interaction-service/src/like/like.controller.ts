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

  @Get('target/:targetId')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  @ApiQuery({
    name: 'type',
    enum: LikeTargetType,
    enumName: 'LikeTargetType',
    required: true,
  })
  findByTarget(
    @Param('targetId', ParseIntPipe) targetId: number,
    @Query('type', new ParseEnumPipe(LikeTargetType)) type: LikeTargetType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    return this.likeService.findByTarget(targetId, type, page, size);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.likeService.remove(id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.likeService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
