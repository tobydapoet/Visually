import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ConversationMember } from '../conversation_member/entities/conversation_member.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { MessageMediaModule } from '../message_media/message_media.module';
import { ClientModule } from '../client/client.module';
import { ContextModule } from '../context/context.module';
import { KafkaModule } from '../kafka/kafka.module';
import { MentionModule } from '../mention/mention.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, ConversationMember]),
    MessageMediaModule,
    ClientModule,
    ContextModule,
    KafkaModule,
    MentionModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
