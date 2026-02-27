import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { Partitioners } from 'kafkajs';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: `${process.env.MESSAGE_SERVICE_NAME}`,
            brokers: [`${process.env.KAFKA_URL}`],
          },
          consumer: {
            groupId: `${process.env.MESSAGE_SERVICE_NAME}`,
          },
          producer: {
            createPartitioner: Partitioners.LegacyPartitioner,
          },
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
