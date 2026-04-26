import { ContentType } from 'src/enums/ContentType';
import { FeedSource } from 'src/enums/FeedSource';

export class ContentFeedReponseDto {
  contentId!: number;
  contentType!: ContentType;
  createdAt!: Date;
  source!: FeedSource;
}
