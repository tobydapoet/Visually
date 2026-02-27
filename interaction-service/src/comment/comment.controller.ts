import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentTargetType } from 'src/enums/ContentType';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(createCommentDto);
  }

  @Get('target/:targetId')
  findByTarget(
    @Param('targetId', ParseIntPipe) targetId: number,
    @Query('type', new ParseEnumPipe(CommentTargetType))
    type: CommentTargetType,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size: number = 10,
  ) {
    return this.commentService.findByTarget(targetId, type, page, size);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() content: string) {
    return this.commentService.update(id, content);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.remove(id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.commentService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
