import { ContentType } from 'src/enums/content.type';
import { CollabStatus } from 'src/enums/collab_status.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('collabs')
export class Collab {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: ContentType })
  type!: ContentType;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text' })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: CollabStatus, default: CollabStatus.PENDING })
  status!: CollabStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
