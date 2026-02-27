import { ContentStatus } from 'src/enums/content_status.type';
import { PostMedia } from 'src/post_media/entities/post_media.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text' })
  avatarUrl?: string;

  @Column({ type: 'text' })
  caption?: string;

  @Column({ type: 'int', nullable: true })
  musicId?: number | null;

  @Column({ type: 'text', nullable: true })
  musicUrl?: string | null;

  @OneToMany(() => PostMedia, (media) => media.post)
  medias?: PostMedia[];

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
