import { Module } from '@nestjs/common';
import { ShortService } from './short.service';
import { ShortController } from './short.controller';
import { Short } from './entities/short.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { TagModule } from 'src/tag/tag.module';
import { CollabModule } from 'src/collab/collab.module';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Short]),
    ClientModule,
    ContextModule,
    TagModule,
    CollabModule,
    OutboxEventsModule,
  ],
  controllers: [ShortController],
  providers: [ShortService],
  exports: [ShortService],
})
export class ShortModule {}
