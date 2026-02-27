import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from '../../conversation/entities/conversation.entity';
import { ConversationMember } from '../../conversation_member/entities/conversation_member.entity';
import { Attachment } from '../../attachment/entities/attachment.entity';
import { MessageMedia } from '../../message_media/entities/message_media.entity';
import { MessageStatus } from '../../enums/remove.type';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @ManyToOne(() => ConversationMember, (member) => member.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderId' })
  sender!: ConversationMember;

  @Column({ type: 'text', nullable: true })
  content!: string;

  @OneToOne(() => Attachment, (attachment) => attachment.message)
  attachment?: Attachment;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'forwardFromId' })
  forwardFrom?: Message;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo?: Message;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.ACTIVE })
  status!: MessageStatus;

  @OneToMany(() => MessageMedia, (m) => m.message)
  medias?: MessageMedia[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
