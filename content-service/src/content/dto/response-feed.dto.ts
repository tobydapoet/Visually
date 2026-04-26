import { ContentStatus } from 'src/enums/content_status.type';

export class FeedContentResponse {
  id!: number;

  userId!: string;

  username!: string;

  avatarUrl?: string;

  caption?: string;

  medias?: string[];

  likeCount!: number;

  commentCount!: number;

  saveCount!: number;

  repostCount!: number;

  status!: ContentStatus;

  createdAt!: Date;

  hasNewStory!: boolean;

  tags?: {
    id: number;
    name: string;
  }[];

  mentions?: {
    userId: string;
    username: string;
  }[];

  isAd!: boolean;
}

export class FeedContentPageResponse {
  content!: FeedContentResponse[];
  nextCursor?: number | null;
}
