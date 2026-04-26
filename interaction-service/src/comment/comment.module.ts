import { forwardRef, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { LikeModule } from 'src/like/like.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MentionModule } from 'src/mention/mention.module';
import { Like } from 'src/like/entities/like.entity';
import { OutboxEventsModule } from 'src/outbox_events/outbox_events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Like]),
    ClientModule,
    KafkaModule,
    forwardRef(() => LikeModule),
    ContextModule,
    MentionModule,
    OutboxEventsModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
