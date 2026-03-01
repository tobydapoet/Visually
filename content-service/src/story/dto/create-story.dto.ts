import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateStoryDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: 'musicId must be a number' })
  musicId?: number;
}

export class CreateStoryMultipartDto extends CreateStoryDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: any[];
}
