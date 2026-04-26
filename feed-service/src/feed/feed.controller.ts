import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Logger,
  ParseFloatPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { ContentType } from 'src/enums/ContentType';

@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get('home')
  async getFollowFeed(
    @Query('cursor') cursor?: string,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ) {
    return this.feedService.getFollowFeed(cursor, take);
  }

  @Get('reels')
  async getReelsFeed(
    @Query('cursor', new DefaultValuePipe(1), ParseIntPipe) cursor: number = 1,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
  ) {
    return this.feedService.getReelsFeed(cursor, take);
  }

  @Post('reel-current')
  async markReelCurrent(
    @Query('contentType') contentType: ContentType,
    @Query('contentId') contentId: number,
  ) {
    return await this.feedService.markReelCurrent(contentType, contentId);
  }
}
