import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(@Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    console.log('Kafka Client connected');
  }

  emit(topic: string, data: any) {
    return this.kafkaClient.emit(topic, data);
  }

  send(topic: string, data: any) {
    return this.kafkaClient.send(topic, data);
  }

  async publish<T>(topic: string, key: string, payload: T): Promise<void> {
    await this.kafkaClient
      .emit(topic, {
        key,
        value: payload,
      })
      .toPromise();
  }
}
