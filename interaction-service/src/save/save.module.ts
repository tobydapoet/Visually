import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Save } from './entities/save.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { SaveController } from './save.controller';
import { SaveService } from './save.service';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';
import { ContentCacheModule } from 'src/content-cache/content-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Save]),
    ClientModule,
    ContextModule,
    KafkaModule,
    ContentCacheModule,
    OutboxEventsModule,
  ],
  controllers: [SaveController],
  providers: [SaveService],
  exports: [SaveService],
})
export class SaveModule {}
