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
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @IsNotEmpty()
  @IsEnum(ContentType)
  type!: ContentType;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one tag is required' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  names!: string[];
}
