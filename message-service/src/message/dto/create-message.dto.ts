import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MentionItem } from '../../mention/dto/create-mention.dto';

export class CreateMessageDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  conversationId!: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  targetId?: number;

  @IsString()
  senderId!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  replyToMessageId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionItem)
  mentions?: MentionItem[];
}
