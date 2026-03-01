import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateShortDto {
  @ApiProperty()
  @IsString({
    message: 'caption must be a string',
  })
  caption?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsNameAdd?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsIdRemove?: number[];
}
