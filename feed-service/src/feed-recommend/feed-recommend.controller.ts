import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedRecommendService } from './feed-recommend.service';
import { CreateFeedRecommendDto } from './dto/create-feed-recommend.dto';
import { UpdateFeedRecommendDto } from './dto/update-feed-recommend.dto';

@Controller('feed-recommend')
export class FeedRecommendController {
  constructor(private readonly feedRecommendService: FeedRecommendService) {}

  @Post()
  create(@Body() createFeedRecommendDto: CreateFeedRecommendDto) {
    return this.feedRecommendService.create(createFeedRecommendDto);
  }

  @Get()
  findAll() {
    return this.feedRecommendService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedRecommendService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeedRecommendDto: UpdateFeedRecommendDto) {
    return this.feedRecommendService.update(+id, updateFeedRecommendDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feedRecommendService.remove(+id);
  }
}
