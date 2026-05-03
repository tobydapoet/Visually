import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mention]), ClientModule, ContextModule],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
