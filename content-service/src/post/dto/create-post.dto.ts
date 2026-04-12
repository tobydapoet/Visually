import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CreateMentionContentDto } from 'src/mention/dto/create-mention.dto';

export class CreatePostDto {
  @ApiProperty()
  @IsOptional()
  @IsString({
    message: 'caption must be a string',
  })
  caption?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsName?: string[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  collabUserId?: string[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  })
  mentions?: CreateMentionContentDto[];
}

export class CreatePostMultipartDto extends CreatePostDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: any[];
}
