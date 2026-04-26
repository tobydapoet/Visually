import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  Delete,
  ParseBoolPipe,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoryService } from './story.service';
import {
  CreateStoryDto,
  CreateStoryMultipartDto,
  StoryToStorageDto,
} from './dto/create-story.dto';
import { StoryResponseDto } from './dto/response-story.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StoryInteractionType } from 'src/enums/interaction.type';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Story')
@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateStoryMultipartDto })
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

  @Put('storage/add')
  async addStoryToStorage(
    @Query('storageId', ParseIntPipe) storageId: number,
    @Query('storyId', ParseIntPipe) storyId: number,
  ) {
    const res = await this.storyService.addStoryToStorage(storageId, storyId);

    return {
      message: 'Add story from storage success!',
      data: res,
    };
  }

  @Put('storage/remove')
  async removeStoryFromStorage(
    @Query('storageId', ParseIntPipe) storageId: number,
    @Query('storyId', ParseIntPipe) storyId: number,
  ) {
    const res = await this.storyService.removeStoryFromStorage(
      storageId,
      storyId,
    );
    return {
      message: 'Remove story from storage success!',
      data: res,
    };
  }

  @Get('user')
  @ApiBearerAuth()
  async findByUser(
    @Query('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size = 10,
    @Query('filterStorage', new ParseBoolPipe({ optional: true }))
    filterStorage = false,
  ) {
    if (size > 50) {
      throw new BadRequestException('Maximum page size is 50');
    }

    return this.storyService.findByUser(userId, page, size, filterStorage);
  }

  @Get('user-valid/:username')
  @ApiBearerAuth()
  async getNonExpiredStoriesByUser(@Param('username') username: string) {
    return this.storyService.getNonExpiredStoriesByUser(username);
  }

  @Get('valid')
  @ApiBearerAuth()
  async getNonExpiredStories(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size = 10,
  ) {
    return this.storyService.getNonExpiredStories(page, size);
  }

  @Get('storage/:storageId')
  async findByStorage(
    @Param('storageId', ParseIntPipe) storageId: number,
  ): Promise<StoryResponseDto[]> {
    return this.storyService.getStoryInStorage(storageId);
  }

  @Get('me')
  @ApiBearerAuth()
  async getMyStories(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('size', new ParseIntPipe({ optional: true })) size = 10,
  ) {
    return this.storyService.getCurrentUserStory(page, size);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StoryResponseDto> {
    return this.storyService.findOneWithUrl(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  async deleteStory(@Param('id') id: number) {
    return this.storyService.delete(id);
  }

  @EventPattern('story.liked')
  async handlestoryLiked(@Payload() data: { storyId: number }) {
    console.log('📨 story liked:', data);
    await this.storyService.updateInteraction(
      data.storyId,
      StoryInteractionType.LIKE,
    );
  }

  @EventPattern('story.disliked')
  async handlestoryUnliked(@Payload() data: { storyId: number }) {
    console.log('📨 story disliked:', data);
    await this.storyService.updateInteraction(
      data.storyId,
      StoryInteractionType.DISLIKE,
    );
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.storyService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
