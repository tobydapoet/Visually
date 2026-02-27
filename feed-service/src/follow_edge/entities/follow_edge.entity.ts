import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('follow_edge')
export class FollowEdge {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  followerId!: string;

  @Column({ type: 'uuid', nullable: false })
  followedId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
