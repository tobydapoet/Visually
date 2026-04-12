import { ContentServiceType } from 'src/enums/ContentType';
import { ReportReason } from 'src/enums/ReportReason';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
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

  @Column({ type: 'enum', enum: ContentServiceType, nullable: false })
  targetType!: ContentServiceType;

  @Column({ type: 'enum', enum: ReportReason, nullable: false })
  reason!: ReportReason;

  @CreateDateColumn()
  createdAt!: Date;
}
