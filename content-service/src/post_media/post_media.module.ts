import { Module } from '@nestjs/common';
import { PostMediaService } from './post_media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMedia } from './entities/post_media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostMedia])],
  providers: [PostMediaService],
  exports: [PostMediaService],
})
export class PostMediaModule {}
