import { AttachmentType } from '../../enums/attachment.type';

export class CreateAttachmentDto {
  messageId!: number;

  targetId!: number;

  targetType!: AttachmentType;
}
