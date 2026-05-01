import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  Put,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { AskBotDto, CreateMessageDto } from './dto/create-message.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiBearerAuth()
  @ApiBody({ type: CreateMessageDto })
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.messageService.create(createMessageDto, files);
  }

  @Post('conversation/:conversationId/ask-bot')
  @ApiBearerAuth()
  @ApiBody({ type: AskBotDto })
  @HttpCode(HttpStatus.CREATED)
  askBot(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: AskBotDto,
  ) {
    return this.messageService.askBot(conversationId, dto.content);
  }

  @Get('conversation/:conversationId')
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  findByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.messageService.findByConversation(
      conversationId,
      page,
      size,
      keyword,
    );
  }

  @Put(':id')
  updateMessage(@Param('id') id: number, @Body() dto: UpdateMessageDto) {
    return this.messageService.updateMessage(id, dto);
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: number) {
    return this.messageService.deleteMessage(id);
  }
}
