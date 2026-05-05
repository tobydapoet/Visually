import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ContextModule } from 'src/context/context.module';
import { ContentCacheModule } from 'src/content-cache/content-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    ContextModule,
    ContentCacheModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
