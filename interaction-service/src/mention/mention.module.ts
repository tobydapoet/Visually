import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mention])],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
