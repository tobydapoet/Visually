import { StoryStorage } from 'src/story_storage/entities/story_storage.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text' })
  avatarUrl?: string;

  @Column({ type: 'int', nullable: false })
  mediaId!: number;

  @Column({ type: 'text', nullable: false })
  mediaUrl!: string;

  @Column({ type: 'int', nullable: true })
  musicId?: number;

  @Column({ type: 'text', nullable: true })
  musicUrl?: string;

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @ManyToOne(() => StoryStorage, (storage) => storage.stories, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'storageId' })
  storage?: StoryStorage;

  @Column({ type: 'boolean', default: false })
  isDeleted!: Boolean;

  @Column({ type: 'timestamp' })
  expiredAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
