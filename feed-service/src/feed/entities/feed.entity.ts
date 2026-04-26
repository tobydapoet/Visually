import { ContentType } from 'src/enums/ContentType';
import { FeedSource } from 'src/enums/FeedSource';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('feeds')
@Index(['userId', 'score', 'createdAt'])
@Index(['userId', 'isSeen'])
@Index(['userId', 'source'])
@Index(['userId', 'contentId', 'contentType'], { unique: true })
export class Feed {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'bigint' })
  contentId!: number;

  @Column({ type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ type: 'enum', enum: FeedSource })
  source!: FeedSource;

  @Column({ type: 'decimal', precision: 20, scale: 10 })
  score!: number;

  @Column({ default: false })
  isSeen!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  seenAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
