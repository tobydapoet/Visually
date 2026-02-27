import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CommentTargetType } from 'src/enums/ContentType';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @IsNotEmpty()
  @IsEnum(CommentTargetType)
  targetType!: CommentTargetType;

  @IsString()
  content?: string;
}
