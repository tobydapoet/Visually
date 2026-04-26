import { ContentType } from 'src/enum/content.type';

export class ContentPayloadEvent {
  followerIds!: string[];
  contentId!: number;
  senderId!: string;
  username!: string;
  contentType!: ContentType;
  avatarUrl?: string;
  timestamp!: Date;
}

export class CommentPayloadEvent {
  senderId!: string;
  username!: string;
  avatarUrl?: string;
  rootUserId!: string;
  receiverId?: string;
  contentId!: number;
  contentType!: ContentType;
  commentId!: number;
  timestamp!: Date;
}

export class LikePayloadEvent {
  contentId!: number;
  contentType!: ContentType;
  senderId!: string;
  receiverId!: string;
  username!: string;
  avatarUrl?: string;
  likeId!: number;
  timestamp!: string;
}

export class FollowPayloadEvent {
  followerId!: string;
  followedId!: string;
  followerUsername!: string;
  followerAvatarUrl?: string;
}
