import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MessageMediaService } from './message_media.service';

@Controller('message-media')
export class MessageMediaController {
  constructor(private readonly messageMediaService: MessageMediaService) {}

  @Get('conversation/:conversationId/media')
  async getMediaByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.messageMediaService.findByConversation(
      +conversationId,
      +page,
      +limit,
    );
  }
}
