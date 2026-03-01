import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ContentType } from 'src/enums/content.type';

export class CreateCollabDto {
  @IsNumber()
  @IsNotEmpty()
  targetId!: number;

  @ApiProperty({
    enum: ContentType,
    enumName: 'ContentType',
  })
  @IsNotEmpty()
  @IsEnum(ContentType)
  type!: ContentType;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one userId is required' })
  @IsUUID('4', { each: true, message: 'Each userId must be a valid UUID' })
  userIds!: string[];
}
