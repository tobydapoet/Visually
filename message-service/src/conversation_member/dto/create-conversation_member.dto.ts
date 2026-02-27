import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateConversationMemberDto {
  @IsNumber()
  conversationId!: number;

  @IsUUID('4', { each: true })
  userIds!: string[];
}
