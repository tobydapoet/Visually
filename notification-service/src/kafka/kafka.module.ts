import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

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
  exports: [ClientsModule],
})
export class KafkaModule {}
