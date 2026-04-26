import { ContentStatus } from 'src/enums/content_status.type';

export interface CreateOutboxEventDto {
  eventType: string;
  payload: {
    contentId?: number;
    senderId?: string;
    username?: string;
    avatarUrl?: string;
    contentType: 'POST' | 'SHORT' | 'STORY';
    tags?: string[];
    createdAt?: Date;
  };
}

export interface UpdateStatusOutboxEventDto {
  eventType: string;
  payload: {
    contentId?: number;
    type: 'POST' | 'SHORT';
    status: ContentStatus;
  };
}

export interface DeleteOutboxEventDto {
  eventType: string;
  payload: {
    contentId: number;
    contentType: 'POST' | 'SHORT';
    timestamp: string;
  };
}
