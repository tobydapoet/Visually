import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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
import { MessageMedia } from '../../message_media/entities/message_media.entity';
import { Mention } from '../../mention/entities/mention.entity';

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

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo?: Message;

  @OneToMany(() => MessageMedia, (m) => m.message)
  medias?: MessageMedia[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Mention, (mention) => mention.message, {
    cascade: true,
  })
  mentions?: Mention[];
}
