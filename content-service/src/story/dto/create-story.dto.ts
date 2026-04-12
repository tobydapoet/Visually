import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateStoryDto {
  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  @IsNumber({}, { message: 'musicId must be a number' })
  musicId?: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  @IsNumber({}, { message: 'startMusicTime must be a number' })
  startMusicTime?: number;
}

export class CreateStoryMultipartDto extends CreateStoryDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: any[];
}

export class StoryToStorageDto {
  @IsArray()
  @IsInt({ each: true })
  storyIds!: number[];
}
