import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ContentType } from 'src/enums/content.type';

export class RepostReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  originalId!: number;

  @ApiProperty({
    enum: ContentType,
    enumName: 'ContentType',
  })
  @IsNotEmpty()
  @IsEnum(ContentType)
  originalType!: ContentType;
}
