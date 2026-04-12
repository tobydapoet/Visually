import { Module } from '@nestjs/common';
import { InteractionController } from './interaction.controller';
import { LikeModule } from 'src/like/like.module';
import { CommentModule } from 'src/comment/comment.module';
import { ShareModule } from 'src/share/share.module';
import { ContextModule } from 'src/context/context.module';
import { InteractionService } from './interaction.service';

@Module({
  imports: [ContextModule, LikeModule, CommentModule, ShareModule],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}
