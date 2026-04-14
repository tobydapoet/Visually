import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Save } from './entities/save.entity';
import { ClientModule } from 'src/client/client.module';
import { ContextModule } from 'src/context/context.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { SaveController } from './save.controller';
import { SaveService } from './save.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Save]),
    ClientModule,
    ContextModule,
    KafkaModule,
  ],
  controllers: [SaveController],
  providers: [SaveService],
  exports: [SaveService],
})
export class SaveModule {}
