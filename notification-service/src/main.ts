import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

console.log('process.env.KAFKA_URL: ', process.env.KAFKA_URL);
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
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.SERVER_PORT ?? 3000);
}

bootstrap();
