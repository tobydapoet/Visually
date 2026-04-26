import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_interests')
export class UserInterest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  tagName!: string;

  @Column({ type: 'float', default: 0 })
  score!: number;
}
