import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CommentTargetType } from 'src/enums/ContentType';
import { MentionItem } from 'src/mention/dto/create-mention.dto';

export class CreateCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @ApiProperty({
    enum: CommentTargetType,
    enumName: 'CommentTargetType',
  })
  @IsNotEmpty()
  @IsEnum(CommentTargetType)
  targetType!: CommentTargetType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  replyToId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionItem)
  mentions?: MentionItem[];
}
