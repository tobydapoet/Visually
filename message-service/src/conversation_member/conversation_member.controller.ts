import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ConversationMemberService } from './conversation_member.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateConversationMemberDto } from './dto/create-conversation_member.dto';

@Controller('conversation-member')
export class ConversationMemberController {
  constructor(
    private readonly conversationMemberService: ConversationMemberService,
  ) {}

  @Post()
  @ApiBearerAuth()
  invite(@Body() createConversationMemberDto: CreateConversationMemberDto) {
    this.conversationMemberService.invite(createConversationMemberDto);
  }

  @Get('conversation/:conversationId/search')
  @ApiBearerAuth()
  searchMemberByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('keyword') keyword: string,
  ) {
    return this.conversationMemberService.searchMemberByConversation(
      conversationId,
      keyword,
    );
  }

  @Get('conversation/:conversationId')
  @ApiBearerAuth()
  findByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.conversationMemberService.getMemberByConversation(
      conversationId,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conversationMemberService.findOne(id);
  }

  @Put('conversation/:conversationId/seen')
  @ApiBearerAuth()
  updateLastSeen(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.conversationMemberService.updateLastSeen(conversationId);
  }

  @Put('remove/:id')
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number) {
    const res = await this.conversationMemberService.removeMember(id);
    if (res) {
      return { message: 'Remove user success!' };
    }
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.conversationMemberService.updateAvatarUrl(
      data.id,
      data.avatarUrl,
    );
  }

  @EventPattern('user.status.changed')
  updateStatus(@Payload() data: { userId: string; lastSeen: Date | null }) {
    return this.conversationMemberService.updateStatus(
      data.userId,
      data.lastSeen,
    );
  }
}
