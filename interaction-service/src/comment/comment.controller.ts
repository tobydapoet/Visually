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
  DefaultValuePipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentTargetType } from 'src/enums/ContentType';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(createCommentDto);
  }

  @Get('target/:targetId')
  @ApiQuery({
    name: 'type',
    enum: CommentTargetType,
    enumName: 'CommentTargetType',
    required: true,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  findByTarget(
    @Param('targetId', ParseIntPipe) targetId: number,
    @Query('type', new ParseEnumPipe(CommentTargetType))
    type: CommentTargetType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    return this.commentService.findByTarget(targetId, type, page, size);
  }

  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() content: string) {
    return this.commentService.update(id, content);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.remove(id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.commentService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
