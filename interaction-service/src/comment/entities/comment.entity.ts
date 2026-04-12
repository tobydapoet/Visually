import { CommentTargetType } from 'src/enums/ContentType';
import { Mention } from 'src/mention/entities/mention.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'integer', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: CommentTargetType, nullable: false })
  targetType!: CommentTargetType;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'replyToId' })
  replyTo?: Comment;

  @OneToMany(() => Comment, (comment) => comment.replyTo)
  replies?: Comment[];

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  replyCount!: number;

  @OneToMany(() => Mention, (mention) => mention.comment, {
    cascade: true,
  })
  mentions?: Mention[];

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
