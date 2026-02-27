import { Injectable } from '@nestjs/common';
import {
  CreateOutboxEventDto,
  UpdateStatusOutboxEventDto,
} from './dto/create-outbox_event.dto';
import { OutboxEvent } from './entities/outbox_event.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EventStatus } from 'src/enums/event_status.type';
import { InjectRepository } from '@nestjs/typeorm';
import { KafkaService } from 'src/kafka/kafka.service';

@Injectable()
export class OutboxEventsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(OutboxEvent) private outboxRepo: Repository<OutboxEvent>,
    private kafkaService: KafkaService,
  ) {}

  async create(
    manager: EntityManager,
    dto: CreateOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async updateStatus(
    manager: EntityManager,
    dto: UpdateStatusOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
    });
  }

  async processBatch(): Promise<OutboxEvent[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const events: OutboxEvent[] = await queryRunner.manager.query(`
      SELECT *
      FROM outbox_events
      WHERE status = 'PENDING'
      ORDER BY "createdAt"
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    `);

      if (events.length === 0) {
        await queryRunner.commitTransaction();
        return [];
      }

      const ids = events.map((e) => e.id);

      await queryRunner.manager
        .createQueryBuilder()
        .update(OutboxEvent)
        .set({ status: EventStatus.PROCESSING })
        .whereInIds(ids)
        .execute();

      await queryRunner.commitTransaction();

      return events;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async run(): Promise<void> {
    const events = await this.processBatch();

    if (!events.length) return;

    for (const event of events) {
      await this.publishToKafka(event);
    }
  }

  async publishToKafka(event: OutboxEvent) {
    try {
      await this.kafkaService.publish(
        event.eventType,
        event.id.toString(),
        event.payload,
      );

      await this.outboxRepo.update(event.id, {
        status: EventStatus.PROCESSED,
      });
    } catch (error) {
      const retryCount = event.retryCount + 1;

      await this.outboxRepo.update(event.id, {
        status: retryCount > 5 ? EventStatus.FAILED : EventStatus.PENDING,
        retryCount,
      });
    }
  }
}
