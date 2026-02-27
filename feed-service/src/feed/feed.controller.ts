import { Controller, Get, Logger, Query } from '@nestjs/common';
import { FeedService } from './feed.service';
import { ContentType } from 'src/enums/ContentType';

@Controller()
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  async getFeed(
    @Query('userId') userId: string,
    @Query('type') type: ContentType,
    @Query('size') size?: string,
  ) {
    return this.feedService.getByUser(userId, type, size ? Number(size) : 20);
  }
}
