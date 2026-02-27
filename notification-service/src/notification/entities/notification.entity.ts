import { ContentType } from 'src/enum/content.type';
import { NotificationType } from 'src/enum/notification.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text' })
  snapshotUrl?: string;

  @Column({ type: 'int', nullable: true })
  contentId!: number;

  @Column({ type: 'enum', enum: ContentType, nullable: true })
  contentType!: ContentType;

  @Column({ type: 'enum', enum: NotificationType, nullable: true })
  type!: NotificationType;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
