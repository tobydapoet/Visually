import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { StoryStorageService } from './story_storage.service';
import { ContextService } from 'src/context/context.service';
import { StoryStorageResponse } from './dto/response-story_storage.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Story-storage')
@Controller('story-storage')
export class StoryStorageController {
  constructor(
    private readonly storyStorageService: StoryStorageService,
    private readonly contextService: ContextService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
      required: ['name'],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() name: string) {
    const savedStorage = await this.storyStorageService.create(name);
    if (savedStorage) {
      return {
        message: 'Update short success!',
      };
    } else {
      return {
        message: 'Update short failed!',
      };
    }
  }

  @Get('me')
  @ApiBearerAuth()
  async findMyStorages(): Promise<StoryStorageResponse[]> {
    const userId = this.contextService.getUserId();
    return this.storyStorageService.findByUser(userId);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
  ): Promise<StoryStorageResponse[]> {
    return this.storyStorageService.findByUser(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.storyStorageService.remove(id);
  }
}
