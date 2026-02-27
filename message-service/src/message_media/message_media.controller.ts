import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MessageMediaService } from './message_media.service';
import { CreateMessageMediaDto } from './dto/create-message_media.dto';
import { UpdateMessageMediaDto } from './dto/update-message_media.dto';

@Controller('message-media')
export class MessageMediaController {
  constructor(private readonly messageMediaService: MessageMediaService) {}

  @Post()
  create(@Body() createMessageMediaDto: CreateMessageMediaDto) {
    // return this.messageMediaService.create(createMessageMediaDto);
  }
}
