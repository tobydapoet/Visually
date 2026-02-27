import { ContentType } from 'src/enums/ContentType';

export class LikeEventPayload {
  contentId!: number;
  contentType!: ContentType;
  userId!: string;
  authorId!: string;
  likeId!: number;
  timestamp!: Date;
}

export class CommentEventPayload {
  contentId!: number;
  contentType!: ContentType;
  userId!: string;
  authorId!: string;
  commentId!: number;
  timestamp!: Date;
}

export class ShareEventPayload {
  contentId!: number;
  userId!: string;
  contentType!: ContentType;
}
