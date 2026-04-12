import { Module } from '@nestjs/common';
import { ConversationMemberService } from './conversation_member.service';
import { ConversationMemberController } from './conversation_member.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation_member.entity';
import { ClientModule } from '../client/client.module';
import { ContextModule } from '../context/context.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationMember]),
    ConversationMemberModule,
    ClientModule,
    MessageModule,
    ContextModule,
  ],
  controllers: [ConversationMemberController],
  providers: [ConversationMemberService],
  exports: [ConversationMemberService],
})
export class ConversationMemberModule {}
