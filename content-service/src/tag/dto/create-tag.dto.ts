import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { ContentType } from 'src/enums/content.type';

export class CreateTagDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @ApiProperty({
    enum: ContentType,
    enumName: 'ContentType',
  })
  @IsNotEmpty()
  @IsEnum(ContentType)
  type!: ContentType;

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one tag is required' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  names!: string[];
}
