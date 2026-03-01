import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ContentType } from 'src/enums/ContentType';

export class CreateShareDto {
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

  @ApiProperty()
  @IsBoolean()
  isPublic?: boolean;
}
