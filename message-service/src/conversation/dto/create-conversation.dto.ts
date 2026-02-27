import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ConversationType } from '../../enums/conversation.type';

export class CreateConversationDto {
  @IsString()
  name!: string;

  @IsUUID('4', { each: true })
  memberIds!: string[];
}
