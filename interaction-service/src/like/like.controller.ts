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
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeTargetType } from 'src/enums/ContentType';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLikeDto: CreateLikeDto) {
    return this.likeService.create(createLikeDto);
  }

  @Get('target/:targetId')
  findByTarget(
    @Param('targetId', ParseIntPipe) targetId: number,
    @Query('type', new ParseEnumPipe(LikeTargetType)) type: LikeTargetType,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size: number = 10,
  ) {
    return this.likeService.findByTarget(targetId, type, page, size);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.likeService.remove(id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.likeService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
