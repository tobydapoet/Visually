import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  constructor(@Inject('KAFKA_SERVICE') private contentClient: ClientKafka) {}

  async onModuleInit() {
    this.contentClient.subscribeToResponseOf('user.get');
    await this.contentClient.connect();
  }

  emit(topic: string, data: any) {
    return this.contentClient.emit(topic, data);
  }

  send(topic: string, data: any) {
    return this.contentClient.send(topic, data);
  }
}
