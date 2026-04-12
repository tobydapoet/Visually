import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '../../message/entities/message.entity';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @ManyToOne(() => Message, (message) => message.mentions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message!: Message;
}
