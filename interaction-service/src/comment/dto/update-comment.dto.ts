import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MentionItem } from '../../mention/dto/create-mention.dto';
import { Type } from 'class-transformer';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionItem)
  mentions?: MentionItem[];
}
