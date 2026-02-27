import { ContentType } from 'src/enums/ContentType';

export class FeedRepose {
  contentId!: number;
  contentType!: ContentType;
}

export class FeedItem {
  contentId!: number;
  contentType!: ContentType;
  isSponsored!: boolean;
}
