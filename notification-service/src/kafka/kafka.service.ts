import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  constructor(@Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('user.get');
    await this.kafkaClient.connect();
  }

  emit(topic: string, data: any) {
    return this.kafkaClient.emit(topic, data);
  }

  send(topic: string, data: any) {
    return this.kafkaClient.send(topic, data);
  }
}
