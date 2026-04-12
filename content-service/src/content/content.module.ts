import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ShortModule } from 'src/short/short.module';
import { PostModule } from 'src/post/post.module';
import { StoryModule } from 'src/story/story.module';

@Module({
  imports: [ShortModule, PostModule, StoryModule],
  controllers: [ContentController],
})
export class ContentModule {}
