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
  DefaultValuePipe,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';

@Controller('messages')
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

  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() content: string) {
    return this.messageService.update(id, content);
  }

  @ApiBearerAuth()
  @Delete(':id/private')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePrivate(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.removePrivate(id);
  }

  @ApiBearerAuth()
  @Delete(':id/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWithAll(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.removeWithAll(id);
  }
}
