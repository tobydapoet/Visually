import {
  CommentTargetType,
  ContentServiceType,
  ContentType,
  LikeTargetType,
} from 'src/enums/ContentType';

export interface LikeOutboxEventDto {
  eventType: string;
  payload: {
    senderId: string;
    username: string;
    avatarUrl?: string;
    contentId: number;
    contentType: LikeTargetType;
    receiverId: string;
    likeId: number;
    timestamp: string;
    likeCount: number;
    commentCount?: number;
    saveCount?: number;
    caption?: string;
    tags?: {
      id: number;
      name: string;
    }[];
  };
}

export interface DislikeOutboxEventDto {
  eventType: string;
  payload: {
    contentId: number;
    contentType: LikeTargetType;
    userId: string;
    timestamp: string;
  };
}

export interface CommentOutboxEventDto {
  eventType: string;
  payload: {
    senderId: string;
    username: string;
    avatarUrl?: string;
    receiverId?: string;
    rootUserId: string;
    contentId: number;
    contentType: CommentTargetType;
    commentId: number;
    timestamp: string;
    likeCount: number;
    commentCount?: number;
    saveCount?: number;
    caption?: string;
    tags?: {
      id: number;
      name: string;
    }[];
  };
}

export interface DeleteCommentOutboxEventDto {
  eventType: string;
  payload: {
    deletedCount: number;
    contentId: number;
    contentType: CommentTargetType;
    timestamp: string;
  };
}

export interface SaveOutboxEventDto {
  eventType: string;
  payload: {
    userId: string;
    contentId: number;
    contentType: ContentType;
  };
}

export interface ViewOutboxEventDto {
  eventType: string;
  payload: {
    watchTime: number;
    senderId: string;
    contentId: number;
    contentType: ContentServiceType;
    caption?: string;
    timestamp: string;
    tags?: {
      id: number;
      name: string;
    }[];
  };
}
