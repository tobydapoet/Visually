import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { ClientModule } from 'src/client/client.module';
import { PostMediaModule } from 'src/post_media/post_media.module';
import { ContextModule } from 'src/context/context.module';
import { TagModule } from 'src/tag/tag.module';
import { CollabModule } from 'src/collab/collab.module';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';
import { ShortModule } from 'src/short/short.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    ClientModule,
    PostMediaModule,
    ContextModule,
    TagModule,
    CollabModule,
    OutboxEventsModule,
    ShortModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
