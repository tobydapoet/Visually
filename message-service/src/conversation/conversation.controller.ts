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
  DefaultValuePipe,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@ApiTags('Conversation')
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createConversationDto: CreateConversationDto) {
    const savedConverstation = await this.conversationService.create(
      createConversationDto,
    );
    if (savedConverstation) {
      return {
        message: 'Create conversation success!',
      };
    } else {
      return {
        message: 'Create conversation failed!',
      };
    }
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: number,
    @Body() updateConversationDto: UpdateConversationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const savedConverstation = await this.conversationService.update(
      id,
      updateConversationDto,
      file,
    );
    if (savedConverstation) {
      return {
        message: 'Update conversation success!',
      };
    } else {
      return {
        message: 'Update conversation failed!',
      };
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ) {
    return this.conversationService.findAll(page, size);
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  getCoverstationWithUser(@Param('userId') userId: string) {
    return this.conversationService.getOrCreatePrivateConversation(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findOne(id);
  }
}
