import { CommentTargetType } from 'src/enums/ContentType';
import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ type: 'text' })
  avatarUrl?: string;

  @Column({ type: 'integer', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: CommentTargetType, nullable: false })
  targetType!: CommentTargetType;

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
