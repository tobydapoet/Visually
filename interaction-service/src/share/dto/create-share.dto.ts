import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ContentType } from 'src/enums/ContentType';

export class CreateShareDto {
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @IsNotEmpty()
  @IsEnum(ContentType)
  targetType!: ContentType;

  @IsBoolean()
  isPublic?: boolean;
}
