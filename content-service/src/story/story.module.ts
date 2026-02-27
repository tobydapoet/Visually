import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './entities/story.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { StoryStorage } from 'src/story_storage/entities/story_storage.entity';
import { StoryStorageModule } from 'src/story_storage/story_storage.module';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story]),
    ClientModule,
    StoryStorage,
    ContextModule,
    StoryStorageModule,
    OutboxEventsModule,
  ],
  controllers: [StoryController],
  providers: [StoryService],
})
export class StoryModule {}
