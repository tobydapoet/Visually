import { Module } from '@nestjs/common';
import { ShortService } from './short.service';
import { ShortController } from './short.controller';
import { Short } from './entities/short.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { TagModule } from 'src/tag/tag.module';
import { CollabModule } from 'src/collab/collab.module';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';
import { MentionModule } from 'src/mention/mention.module';
import { Repost } from 'src/repost/entities/repost.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Short, Repost]),
    ClientModule,
    ContextModule,
    TagModule,
    CollabModule,
    OutboxEventsModule,
    MentionModule,
  ],
  controllers: [ShortController],
  providers: [ShortService],
  exports: [ShortService],
})
export class ShortModule {}
