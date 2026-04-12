import { ContentType } from 'src/enums/content.type';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'text', nullable: false })
  username!: string;

  @Column({ type: 'int', nullable: false })
  targetId!: number;

  @Column({ type: 'enum', enum: ContentType })
  type!: ContentType;
}
