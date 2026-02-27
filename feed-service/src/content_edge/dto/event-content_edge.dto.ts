import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { ContentType } from 'src/enums/ContentType';

export class ContentCreateEventDto {
  @IsNumber()
  contentId!: number;

  @IsUUID()
  authorId!: string;

  @IsEnum(ContentType)
  type!: ContentType;

  @IsString()
  username!: string;

  @IsString()
  avatarUrl?: string;

  @IsDateString()
  createdAt!: Date;

  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
