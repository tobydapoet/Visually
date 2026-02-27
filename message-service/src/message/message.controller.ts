import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.messageService.create(createMessageDto, files);
  }

  @Get('conversation/:conversationId')
  findByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.messageService.findByConversation(
      conversationId,
      page,
      limit,
      keyword,
    );
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() content: string) {
    return this.messageService.update(id, content);
  }

  @Delete(':id/private')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePrivate(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.removePrivate(id);
  }

  @Delete(':id/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWithAll(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.removeWithAll(id);
  }
}
