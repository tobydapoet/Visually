import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '../../message/entities/message.entity';

@Entity('message_medias')
export class MessageMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Message, (m) => m.medias, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'messageId' })
  message!: Message;

  @Column()
  mediaId!: number;

  @Column()
  url!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
