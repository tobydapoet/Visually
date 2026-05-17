import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

console.log('Kafka broker:', process.env.KAFKA_URL);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.SERVICE_NAME,
        brokers: [process.env.KAFKA_URL],
      },
      consumer: {
        groupId: process.env.SERVICE_NAME,
        autoCommit: true,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.SERVER_PORT ?? 8089);
}
bootstrap();
