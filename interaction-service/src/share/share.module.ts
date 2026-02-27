import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Share]),
    ClientModule,
    ContextModule,
    KafkaModule,
  ],
  controllers: [ShareController],
  providers: [ShareService],
})
export class ShareModule {}
