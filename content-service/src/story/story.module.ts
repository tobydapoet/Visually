import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './entities/story.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';
import { StoryStorageModule } from 'src/story_storage/story_storage.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story]),
    ClientModule,
    ContextModule,
    OutboxEventsModule,
    StoryStorageModule,
    KafkaModule,
  ],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
