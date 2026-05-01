import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from '../../conversation/entities/conversation.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('conversation_members')
export class ConversationMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @Column({ type: 'uuid', nullable: true })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  username!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'int', nullable: true })
  lastSeenMessageId?: number;

  @Column({ type: 'datetime', nullable: true })
  lastSeen?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  isMutedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  mutedUntil!: Date | null;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Message, (message) => message.sender)
  messages?: Message[];

  @Column({ default: false })
  isBot!: boolean;
}
