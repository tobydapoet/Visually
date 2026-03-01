import { Module } from '@nestjs/common';
import { CollabService } from './collab.service';
import { CollabController } from './collab.controller';
import { Collab } from './entities/collab.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { PostModule } from 'src/post/post.module';
import { ShortModule } from 'src/short/short.module';
import { StoryModule } from 'src/story/story.module';

@Module({
  imports: [TypeOrmModule.forFeature([Collab]), ClientModule, ContextModule],
  controllers: [CollabController],
  providers: [CollabService],
  exports: [CollabService],
})
export class CollabModule {}
