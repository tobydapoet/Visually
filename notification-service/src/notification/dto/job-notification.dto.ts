import { ContentType } from 'src/enum/content.type';
import { NotificationType } from 'src/enum/notification.type';

export class NotificationJob {
  userId!: string;

  snapshotUrl?: string;

  type!: NotificationType;

  contentType?: ContentType;

  contentId!: number;

  username!: string;
}
