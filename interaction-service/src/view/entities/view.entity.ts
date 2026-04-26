import { ContentServiceType } from 'src/enums/ContentType';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('views')
export class View {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'integer', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: ContentServiceType, nullable: false })
  targetType!: ContentServiceType;

  @Column({ type: 'int', nullable: false, default: 0 })
  watchTime!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
