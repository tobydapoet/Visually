import { ContentType } from 'src/enums/ContentType';
import { RecommendModelVersion } from 'src/enums/RecommendModelVersion';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('feed_recommendations')
@Index(['userId', 'createdAt'])
@Index(['userId', 'contentId'])
export class FeedRecommendation {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ type: 'bigint' })
  contentId!: number;

  @Column({ type: 'float' })
  score!: number;

  @Column({ type: 'json', nullable: true })
  reason!: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  components!: Record<string, any>;

  @Column({ type: 'enum', enum: RecommendModelVersion, nullable: true })
  modelVersion!: RecommendModelVersion;

  @CreateDateColumn()
  createdAt!: Date;
}
