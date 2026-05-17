import { Injectable } from '@nestjs/common';
import { OutboxEvent } from './entities/outbox_event.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { KafkaService } from 'src/kafka/kafka.service';
import { EventStatus } from 'src/enums/event_status.type';
import {
  CommentOutboxEventDto,
  DeleteCommentOutboxEventDto,
  DislikeOutboxEventDto,
  LikeOutboxEventDto,
  SaveOutboxEventDto,
  ViewOutboxEventDto,
} from './dto/create-outbox_event.dto';

@Injectable()
export class OutboxEventsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(OutboxEvent) private outboxRepo: Repository<OutboxEvent>,
    private kafkaService: KafkaService,
  ) {}

  async emitLike(
    manager: EntityManager,
    dto: LikeOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async emitDislike(
    manager: EntityManager,
    dto: DislikeOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async emitComment(
    manager: EntityManager,
    dto: CommentOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async emitDeleteComment(
    manager: EntityManager,
    dto: DeleteCommentOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async emitSave(
    manager: EntityManager,
    dto: SaveOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async emitUnSave(
    manager: EntityManager,
    dto: SaveOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
    });
  }

  async emitView(
    manager: EntityManager,
    dto: ViewOutboxEventDto,
  ): Promise<void> {
    await manager.save(OutboxEvent, {
      eventType: dto.eventType,
      payload: dto.payload,
      status: EventStatus.PENDING,
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

  async cleanOldEvents() {
    await this.outboxRepo
      .createQueryBuilder()
      .delete()
      .from(OutboxEvent)
      .where('status = :status', { status: EventStatus.PROCESSED })
      .andWhere('createdAt < NOW() - INTERVAL 3 DAY')
      .execute();
  }
}
