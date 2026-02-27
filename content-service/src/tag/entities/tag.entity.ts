import { InjectRepository } from '@nestjs/typeorm';
import { ContentType } from 'src/enums/content.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: ContentType })
  type!: ContentType;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
