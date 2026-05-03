import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ShortModule } from 'src/short/short.module';
import { PostModule } from 'src/post/post.module';
import { StoryModule } from 'src/story/story.module';
import { ContentService } from './content.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'src/post/entities/post.entity';
import { Short } from 'src/short/entities/short.entity';
import { ContextModule } from 'src/context/context.module';
import { TagModule } from 'src/tag/tag.module';
import { MentionModule } from 'src/mention/mention.module';
import { ClientModule } from 'src/client/client.module';
import { RepostModule } from 'src/repost/repost.module';
import { Story } from 'src/story/entities/story.entity';

@Module({
  imports: [
    ShortModule,
    PostModule,
    StoryModule,
    ClientModule,
    TagModule,
    MentionModule,
    ContextModule,
    RepostModule,
    TypeOrmModule.forFeature([Post, Short, Story]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
