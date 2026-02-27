import { Module } from '@nestjs/common';
import { ConversationMemberService } from './conversation_member.service';
import { ConversationMemberController } from './conversation_member.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation_member.entity';
import { UserClient } from '../client/user.client';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationMember]),
    ConversationMemberModule,
    ClientModule,
  ],
  controllers: [ConversationMemberController],
  providers: [ConversationMemberService],
  exports: [ConversationMemberService],
})
export class ConversationMemberModule {}
