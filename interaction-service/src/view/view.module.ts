import { Module } from '@nestjs/common';
import { ViewService } from './view.service';
import { ViewController } from './view.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';
import { ContextModule } from 'src/context/context.module';
import { ClientModule } from 'src/client/client.module';
import { View } from './entities/view.entity';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([View]),
    OutboxEventsModule,
    ContextModule,
    ClientModule,
    KafkaModule,
  ],
  controllers: [ViewController],
  providers: [ViewService],
})
export class ViewModule {}
