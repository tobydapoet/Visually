import { Story } from 'src/story/entities/story.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('story_storages')
export class StoryStorage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @OneToMany(() => Story, (story) => story.storage)
  stories?: Story[];

  @CreateDateColumn()
  createdAt!: Date;
}
