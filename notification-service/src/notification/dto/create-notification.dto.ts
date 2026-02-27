import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ContentType } from 'src/enum/content.type';
import { NotificationType } from 'src/enum/notification.type';

export class CreateMultipleNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userId!: string[];

  @IsString()
  snapshotUrl?: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsInt()
  contentId!: number;

  @IsString()
  @IsNotEmpty()
  username!: string;
}

export class CreateNotificationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userId!: string;

  @IsString()
  snapshotUrl?: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsInt()
  contentId?: number;

  @IsString()
  @IsNotEmpty()
  username!: string;
}
