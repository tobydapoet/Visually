import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMemberModule } from '../conversation_member/conversation_member.module';
import { Conversation } from './entities/conversation.entity';
import { ContextModule } from '../context/context.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    ContextModule,
    ConversationMemberModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
