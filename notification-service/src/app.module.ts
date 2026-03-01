import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './notification/notification.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientModule } from './client/client.module';
import { BullModule } from '@nestjs/bullmq';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        db: Number(process.env.REDIS_DB_NOTIFICATION),
      },
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'kafka',
            brokers: [`${process.env.KAFKA_URL}`],
          },
          consumer: {
            groupId: 'kafka-consumer',
          },
        },
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    NotificationModule,
    CleanupModule,
    ClientModule,
    KafkaModule,
  ],
  providers: [AppService],
})
export class AppModule {}
