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
@Index(['userId', 'contentId', 'contentType'], { unique: true })
@Index(['userId', 'createdAt'])
@Index(['userId', 'contentId'])
@Index(['userId', 'source'])
export class Feed {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ type: 'bigint' })
  contentId!: number;

  @Column({ type: 'enum', enum: FeedSource })
  source!: FeedSource;

  @Column({ type: 'float', nullable: true })
  score!: number | null;

  @Column({ default: false })
  isSeen!: boolean;

  @Column({ nullable: true })
  seenAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
