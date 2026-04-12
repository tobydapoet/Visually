import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ContentServiceType } from 'src/enums/ContentType';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async create(@Body() createReportDto: CreateReportDto) {
    const res = await this.reportService.create(createReportDto);
    return {
      message: 'Create report success!',
      data: res,
    };
  }

  @Get()
  findByTarget(
    @Query('targetId') targetId: string,
    @Query('targetType') targetType: ContentServiceType,
    @Query('page') page = '1',
    @Query('size') size = '10',
  ) {
    return this.reportService.findByTarget(
      Number(targetId),
      targetType,
      Number(page),
      Number(size),
    );
  }

  @Delete()
  removeMany(@Body('ids') ids: number[]) {
    return this.reportService.removeMany(ids);
  }
}
