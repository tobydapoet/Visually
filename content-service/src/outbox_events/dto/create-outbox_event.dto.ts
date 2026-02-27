import { ContentStatus } from 'src/enums/content_status.type';

export interface PostCreatedPayload {
  contentId?: number;
  authorId?: string;
  username?: string;
  avatarUrl?: string;
  type: 'POST' | 'SHORT' | 'STORY';
  tags?: string[];
  createdAt?: Date;
}

export interface CreateOutboxEventDto {
  eventType: string;
  payload: PostCreatedPayload;
}

export interface UpdateStatusOutboxEventDto {
  eventType: string;
  payload: {
    contentId?: number;
    type: 'POST' | 'SHORT';
    status: ContentStatus;
  };
}
