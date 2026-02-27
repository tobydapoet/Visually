import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ContentType } from 'src/enums/ContentType';
import { FeedSource } from 'src/enums/FeedSource';

export class CreateFeedDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsNotEmpty()
  @IsNumber()
  contentId!: number;

  @IsNotEmpty()
  @IsEnum(FeedSource)
  source!: FeedSource;

  score!: number | null;
}
