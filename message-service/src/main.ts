import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// console.log('process.env.KAFKA_URL: ', process.env.KAFKA_URL);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
