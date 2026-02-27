import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.create(createConversationDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.conversationService.findAll(
      page ? +page : 1,
      size ? +size : 20,
      keyword,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findOne(id);
  }
}
