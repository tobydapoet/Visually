import { Module } from '@nestjs/common';
import { MentionsService } from './mention.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mention])],
  providers: [MentionsService],
  exports: [MentionsService],
})
export class MentionModule {}
