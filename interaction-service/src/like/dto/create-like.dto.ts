import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { LikeTargetType } from 'src/enums/ContentType';

export class CreateLikeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @ApiProperty({
    enum: LikeTargetType,
    enumName: 'LikeTargetType',
  })
  @IsNotEmpty()
  @IsEnum(LikeTargetType)
  targetType!: LikeTargetType;
}
