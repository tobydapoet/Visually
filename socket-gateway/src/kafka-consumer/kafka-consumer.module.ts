import { Module } from '@nestjs/common';
import { KafkaConsumerController } from './kafka-consumer.controller';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [SocketModule],
  controllers: [KafkaConsumerController],
})
export class KafkaConsumerModule {}
