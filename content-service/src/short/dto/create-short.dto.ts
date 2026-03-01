import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateShortDto {
  @ApiProperty()
  @IsString({
    message: 'caption must be a string',
  })
  caption?: string;

  @ApiProperty()
  @IsNumber(
    {},
    {
      message: 'mediaId must be a number',
    },
  )
  mediaId?: number;

  @IsNumber(
    {},
    {
      message: 'musicId must be a number',
    },
  )
  musicId?: number;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsName?: string[];

  @ApiProperty()
  @IsArray()
  @IsUUID('4', {
    message: 'collabUserId must be a valid UUID',
  })
  collabUserId?: string[];
}

export class CreateShortMultipartDto extends CreateShortDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: any[];
}
