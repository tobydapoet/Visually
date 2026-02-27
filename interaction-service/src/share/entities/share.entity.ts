import { ContentType } from 'src/enums/ContentType';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('shares')
export class Share {
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

  @Column({ type: 'boolean', default: true, nullable: false })
  isPublic!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
