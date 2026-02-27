import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConversationModule } from './conversation/conversation.module';
import { ConversationMemberModule } from './conversation_member/conversation_member.module';
import { MessageModule } from './message/message.module';
import { AttachmentModule } from './attachment/attachment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ContextModule } from './context/context.module';
import { ClientModule } from './client/client.module';
import { MessageMediaModule } from './message_media/message_media.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
    ConversationModule,
    ConversationMemberModule,
    MessageModule,
    AttachmentModule,
    ContextModule,
    ClientModule,
    MessageMediaModule,
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
