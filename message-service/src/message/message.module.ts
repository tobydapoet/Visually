import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ConversationMember } from '../conversation_member/entities/conversation_member.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { AttachmentModule } from '../attachment/attachment.module';
import { MessageMediaModule } from '../message_media/message_media.module';
import { ClientModule } from '../client/client.module';
import { ContextModule } from '../context/context.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, ConversationMember]),
    AttachmentModule,
    MessageMediaModule,
    ClientModule,
    ContextModule,
    KafkaModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}
