import { NotificationType } from 'src/enum/notification.type';

export interface DomainEventPayload {
  receiverIds: string[];
  actorId?: string;
  actorName: string;
  snapshotUrl?: string;
}

export interface DomainEvent {
  type: NotificationType;
  payload: DomainEventPayload;
  occurredAt: string;
  source: 'post-service' | 'user-service' | 'content-service';
}
