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

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text', nullable: false })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  nickname?: string;

  @Column({ type: 'int', nullable: true })
  lastSeenMessageId?: number;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Message, (message) => message.sender)
  messages?: Message[];
}
