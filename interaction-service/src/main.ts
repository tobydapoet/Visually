import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

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

  const config = new DocumentBuilder()
    .setTitle('Interaction service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  await app.startAllMicroservices();
  SwaggerModule.setup('swagger-ui.html', app, document);
  SwaggerModule.setup('v3/api-docs', app, document);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/v3/api-docs.json', (req, res) => {
    res.json(document);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.SERVER_PORT ?? 8085);
}
bootstrap();
