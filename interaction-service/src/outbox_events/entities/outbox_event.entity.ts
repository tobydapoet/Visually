import { EventStatus } from 'src/enums/event_status.type';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventType!: string;

  @Column({ type: 'json' })
  payload: unknown;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PENDING })
  status!: EventStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;
}
