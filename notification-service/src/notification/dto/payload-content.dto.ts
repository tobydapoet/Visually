import { ContentType } from 'src/enum/content.type';

export class ContentPayloadEvent {
  contentId!: number;
  authorId!: string;
  username!: string;
  type!: ContentType;
  avatarUrl?: string;
  createdAt!: Date;
}

export class CommentPayloadEvent {
  receiverIds!: string[];
  usernames!: string[];
  snapshotAvatarUrls!: string[];
  actorName!: string;
  actorAvatarUrl!: string;
  contentId!: number;
  contentType!: ContentType;
  commentId!: string;
}

export class LikePayloadEvent {
  contentId!: number;
  contentType!: ContentType;
  actorName!: string;
  actorAvatarUrl?: string;
  receiverId!: string;
  likeId!: number;
}

export class FollowPayloadEvent {
  followerId!: string;
  followedId!: string;
  followerUsername!: string;
  followerAvatarUrl?: string;
}
