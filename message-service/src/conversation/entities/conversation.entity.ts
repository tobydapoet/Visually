import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationType } from '../../enums/conversation.type';
import { ConversationMember } from '../../conversation_member/entities/conversation_member.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  avatarUrl!: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.PRIVATE,
  })
  type!: ConversationType;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members?: ConversationMember[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages?: Message[];
}
