import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { ContentCacheModule } from 'src/content-cache/content-cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mention]), ContentCacheModule],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
