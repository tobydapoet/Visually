// story.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryResponseDto } from './dto/response-story.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StoryInteractionType } from 'src/enums/interaction.type';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createStoryDto: CreateStoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const savedStory = await this.storyService.create(createStoryDto, file);
    if (savedStory) {
      return {
        message: 'Create story success!',
      };
    } else {
      return {
        message: 'Create story failed!',
      };
    }
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StoryResponseDto> {
    return this.storyService.findOneWithUrl(id);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size = 10,
  ) {
    if (size > 50) {
      throw new BadRequestException('Maximum page size is 50');
    }

    return this.storyService.findByUser(userId, page, size);
  }

  @Get('storage/:storageId')
  async findByStorage(
    @Param('storageId', ParseIntPipe) storageId: number,
  ): Promise<StoryResponseDto[]> {
    return this.storyService.findByStorage(storageId);
  }

  @Get('me')
  async getMyStories(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size = 10,
  ) {
    return this.storyService.getCurrentUserStory(page, size);
  }

  @Delete(':id')
  async deleteStory(@Param('id') id: number) {
    return this.storyService.delete(id);
  }

  @EventPattern('story.liked')
  async handlestoryLiked(@Payload() data: { storyId: number; userId: string }) {
    console.log('📨 story liked:', data);
    await this.storyService.updateInteraction(
      data.storyId,
      StoryInteractionType.LIKE,
    );
  }

  @EventPattern('story.unliked')
  async handlestoryUnliked(
    @Payload() data: { storyId: number; userId: string },
  ) {
    console.log('📨 story unliked:', data);
    await this.storyService.updateInteraction(
      data.storyId,
      StoryInteractionType.UNLIKE,
    );
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.storyService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
