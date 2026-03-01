import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString({
    message: 'caption must be a string',
  })
  caption?: string;

  @ApiProperty()
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

export class CreatePostMultipartDto extends CreatePostDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: any[];
}
