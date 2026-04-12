import {
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class MentionItem {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;
}

export class CreateMentionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionItem)
  mentions!: MentionItem[];

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  commentId!: number;
}
