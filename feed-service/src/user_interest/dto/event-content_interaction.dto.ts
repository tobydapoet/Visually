import { ContentType } from 'src/enums/ContentType';

export class ContentInteractionEvent {
  senderId!: string;
  caption?: string;
  tags?: {
    id: number;
    name: string;
  }[];
}

export class ContentViewEvent {
  watchTime!: number;
  senderId!: string;
  contentId!: number;
  contentType!: ContentType;
  caption?: string;
  tags?: {
    id: number;
    name: string;
  }[];
}
