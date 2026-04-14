import { Module } from '@nestjs/common';
import { RepostService } from './repost.service';
import { RepostController } from './repost.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repost } from './entities/repost.entity';
import { PostModule } from 'src/post/post.module';
import { ShortModule } from 'src/short/short.module';
import { ContextModule } from 'src/context/context.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repost]),
    PostModule,
    ShortModule,
    ContextModule,
  ],
  controllers: [RepostController],
  providers: [RepostService],
})
export class RepostModule {}
