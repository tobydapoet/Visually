import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessageMediaService } from './message_media.service';

@Controller('message-media')
export class MessageMediaController {
  constructor(private readonly messageMediaService: MessageMediaService) {}

  @Get('conversation/:conversationId/media')
  async getMediaByConversation(
    @Param('conversationId') conversationId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.messageMediaService.findByConversation(
      +conversationId,
      +page,
      +limit,
    );
  }
}
