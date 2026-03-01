import { Controller } from '@nestjs/common';
import { MessageMediaService } from './message_media.service';

@Controller('message-media')
export class MessageMediaController {
  constructor(private readonly messageMediaService: MessageMediaService) {}
}
