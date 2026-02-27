import { IsEnum, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ContentType } from 'src/enums/ContentType';

export class CreateContentEdgeDto {
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsNotEmpty()
  @IsNumber()
  contentId!: number;

  @IsNotEmpty()
  @IsUUID()
  authorId!: string;
}
