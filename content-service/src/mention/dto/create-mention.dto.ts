import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { ContentType } from 'src/enums/content.type';

export class CreateMentionDto {
  @ApiProperty()
  @IsUUID('4')
  userId!: string;

  @ApiProperty()
  @IsString()
  username!: string;

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
}

export class CreateMentionContentDto {
  @ApiProperty()
  @IsUUID('4')
  userId!: string;

  @ApiProperty()
  @IsString()
  username!: string;
}
