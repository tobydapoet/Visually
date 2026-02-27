import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
