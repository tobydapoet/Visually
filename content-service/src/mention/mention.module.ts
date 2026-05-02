import { Module } from '@nestjs/common';
import { MentionsService } from './mention.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mention]), ClientModule],
  providers: [MentionsService],
  exports: [MentionsService],
})
export class MentionModule {}
