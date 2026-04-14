import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ContentType } from 'src/enums/ContentType';

export class CreateSaveDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @ApiProperty({
    enum: ContentType,
    enumName: 'ContentType',
  })
  @IsNotEmpty()
  @IsEnum(ContentType)
  targetType!: ContentType;
}
