import { Module } from '@nestjs/common';
import { InteractionController } from './interaction.controller';
import { LikeModule } from 'src/like/like.module';
import { CommentModule } from 'src/comment/comment.module';
import { SaveModule } from 'src/save/save.module';
import { ContextModule } from 'src/context/context.module';
import { InteractionService } from './interaction.service';

@Module({
  imports: [ContextModule, LikeModule, CommentModule, SaveModule],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}
