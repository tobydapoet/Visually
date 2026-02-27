import { forwardRef, Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { CommentModule } from 'src/comment/comment.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like]),
    ClientModule,
    ContextModule,
    KafkaModule,
    forwardRef(() => CommentModule),
  ],
  controllers: [LikeController],
  providers: [LikeService],
  exports: [LikeService],
})
export class LikeModule {}
