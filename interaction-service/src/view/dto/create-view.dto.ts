import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import {
  ContentServiceType,
  ContentServiceType as ViewT,
} from 'src/enums/ContentType';

export class CreateViewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @ApiProperty({
    enum: ContentServiceType,
    enumName: 'ContentServiceType',
  })
  @IsNotEmpty()
  @IsEnum(ContentServiceType)
  targetType!: ContentServiceType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  watchTime!: number;
}
