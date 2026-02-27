import { Module } from '@nestjs/common';
import { MessageMediaService } from './message_media.service';
import { MessageMediaController } from './message_media.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageMedia } from './entities/message_media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageMedia])],
  controllers: [MessageMediaController],
  providers: [MessageMediaService],
  exports: [MessageMediaService],
})
export class MessageMediaModule {}
