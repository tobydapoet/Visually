import { Module } from '@nestjs/common';
import { OutboxEventsService } from './outbox_events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './entities/outbox_event.entity';
import { KafkaModule } from 'src/kafka/kafka.module';
import { OutboxEventsProcessor } from './outbox_events.processor';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent]), KafkaModule],
  providers: [OutboxEventsService, OutboxEventsProcessor],
  exports: [OutboxEventsService],
})
export class OutboxEventsModule {}
