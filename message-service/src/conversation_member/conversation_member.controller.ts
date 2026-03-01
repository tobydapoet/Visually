import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConversationMemberService } from './conversation_member.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('conversation-members')
export class ConversationMemberController {
  constructor(
    private readonly conversationMemberService: ConversationMemberService,
  ) {}

  @Get('conversation/:conversationId')
  @ApiBearerAuth()
  findByConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.conversationMemberService.findByConversation(conversationId);
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conversationMemberService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id', ParseIntPipe) id: number, @Body() nickname: string) {
    return this.conversationMemberService.update(id, nickname);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.conversationMemberService.remove(id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.conversationMemberService.updateAvatarUrl(
      data.id,
      data.avatarUrl,
    );
  }
}
