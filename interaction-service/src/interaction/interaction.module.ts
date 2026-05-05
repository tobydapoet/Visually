import { Module } from '@nestjs/common';
import { InteractionController } from './interaction.controller';
import { LikeModule } from 'src/like/like.module';
import { CommentModule } from 'src/comment/comment.module';
import { SaveModule } from 'src/save/save.module';
import { ContextModule } from 'src/context/context.module';
import { InteractionService } from './interaction.service';
import { ReportModule } from 'src/report/report.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    ContextModule,
    LikeModule,
    CommentModule,
    SaveModule,
    ReportModule,
    KafkaModule,
  ],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}
