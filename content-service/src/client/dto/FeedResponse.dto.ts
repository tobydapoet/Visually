import { ContentType } from 'src/enums/content.type';

export class FeedResponse {
  contentId!: number;
  contentType!: ContentType;
  isAd!: boolean;
}

export class FeedPageResponse {
  content!: FeedResponse[];
  nextCursor?: number;
}
