import { ContentStatus } from 'src/enums/ContentStatus';
import { ContentType } from 'src/enums/ContentType';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['createdAt'])
@Index(['trendingScore'])
@Entity('content_edge')
export class ContentEdge {
  @PrimaryColumn({ type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @PrimaryColumn({ type: 'bigint' })
  contentId!: number;

  @Column({ type: 'uuid' })
  @Index()
  authorId!: string;

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'int', default: 0 })
  shareCount!: number;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.ACTIVE })
  status!: ContentStatus;

  @Column({
    type: 'double',
    default: 0,
  })
  trendingScore!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
