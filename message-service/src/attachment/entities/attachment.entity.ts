import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '../../message/entities/message.entity';
import { AttachmentType } from '../../enums/attachment.type';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Message, (message) => message.attachment, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'messageId' })
  message!: Message;

  @Column({ type: 'int', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: AttachmentType, nullable: false })
  targetType!: AttachmentType;

  @Column({ nullable: true })
  snapshotUsername?: string;

  @Column({ nullable: true })
  snapshotAvatarUrl?: string;

  @Column({ nullable: true })
  snapshotCaption?: string;

  @Column({ nullable: true })
  snapshotMediaUrl?: string;
}
