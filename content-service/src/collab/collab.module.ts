import { Module } from '@nestjs/common';
import { CollabService } from './collab.service';
import { CollabController } from './collab.controller';
import { Collab } from './entities/collab.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from 'src/client/client.module';

@Module({
  imports: [TypeOrmModule.forFeature([Collab]), ClientModule],
  controllers: [CollabController],
  providers: [CollabService],
  exports: [CollabService],
})
export class CollabModule {}
