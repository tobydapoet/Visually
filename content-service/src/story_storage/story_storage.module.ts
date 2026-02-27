import { Module } from '@nestjs/common';
import { StoryStorageService } from './story_storage.service';
import { StoryStorageController } from './story_storage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryStorage } from './entities/story_storage.entity';
import { ContextModule } from 'src/context/context.module';

@Module({
  imports: [TypeOrmModule.forFeature([StoryStorage]), ContextModule],
  controllers: [StoryStorageController],
  providers: [StoryStorageService],
  exports: [StoryStorageService],
})
export class StoryStorageModule {}
