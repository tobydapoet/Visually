import { ContentType } from 'src/enums/ContentType';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('saves')
export class Save {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text' })
  avatarUrl?: string;

  @Column({ type: 'integer', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: ContentType, nullable: false })
  targetType!: ContentType;

  @CreateDateColumn()
  createdAt!: Date;
}
