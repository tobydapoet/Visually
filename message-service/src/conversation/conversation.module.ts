import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMemberModule } from '../conversation_member/conversation_member.module';
import { Conversation } from './entities/conversation.entity';
import { ContextModule } from '../context/context.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    ContextModule,
    ConversationMemberModule,
    ClientModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
