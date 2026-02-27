import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { LikeTargetType } from 'src/enums/ContentType';

export class CreateLikeDto {
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @IsNotEmpty()
  @IsEnum(LikeTargetType)
  targetType!: LikeTargetType;
}
