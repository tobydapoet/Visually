import { AttachmentType } from '../../enums/attachment.type';

export class CreateMessageDto {
  conversationId!: number;

  targetId?: number;

  targetType?: AttachmentType;

  senderId!: string;

  content?: string;

  forwardMesageId?: string;

  replyToMessgageId?: string;
}
