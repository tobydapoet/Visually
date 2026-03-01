import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CommentTargetType } from 'src/enums/ContentType';

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
}
