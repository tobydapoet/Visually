import { ContentType } from 'src/enums/content.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reposts')
export class Repost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'int', nullable: false })
  originalId!: number;

  @Column({
    type: 'enum',
    enum: ContentType,
    nullable: false,
  })
  originalType!: ContentType;

  @CreateDateColumn()
  createdAt!: Date;
}
