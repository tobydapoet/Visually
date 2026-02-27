import { ContentStatus } from 'src/enums/content_status.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shorts')
export class Short {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text' })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: false })
  caption?: string;

  @Column({ type: 'int', nullable: false })
  thumbnailId!: number;

  @Column({ type: 'text', nullable: false })
  thumbnailUrl!: string;

  @Column({ type: 'int' })
  mediaId!: number;

  @Column({ type: 'text', nullable: false })
  mediaUrl!: string;

  @Column({ type: 'int' })
  musicId?: number;

  @Column({ type: 'text', nullable: true })
  musicUrl?: string | null;

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'int', default: 0 })
  shareCount!: number;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.ACTIVE })
  status!: ContentStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
