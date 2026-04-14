import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { RepostService } from './repost.service';
import { RepostReqDto } from './dto/create-repost.dto';
import { ContentType } from 'src/enums/content.type';

@Controller('repost')
export class RepostController {
  constructor(private readonly repostService: RepostService) {}

  @Post()
  create(@Body() createRepostDto: RepostReqDto) {
    return this.repostService.create(createRepostDto);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('size') size = 10,
  ) {
    return this.repostService.findByUser(userId, page, size);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.repostService.findOne(id);
  }

  @Delete()
  remove(
    @Query('originalId', ParseIntPipe) originalId: number,
    @Query('originalType', new ParseEnumPipe(ContentType))
    originalType: ContentType,
  ) {
    return this.repostService.remove({ originalId, originalType });
  }
}
