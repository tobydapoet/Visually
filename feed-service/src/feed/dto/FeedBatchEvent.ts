import { ContentType } from 'src/enums/ContentType';
import { FeedSource } from 'src/enums/FeedSource';

export class FeedBatchEvent {
  followerIds!: string[];
  contentId!: number;
  contentType!: ContentType;
  likeCount!: number;
  commentCount!: number;
  saveCount!: number;
  timestamp!: string;
}

export class FeedBackfillEvent {
  followerId!: string;
  userId!: string;
}

export class FeedItemDto {
  contentId!: number;
  contentType!: ContentType;
  source!: FeedSource;
  score!: number;
  createdAt!: Date;
}
