import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ContentServiceType } from 'src/enums/ContentType';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('target')
  async create(@Body() createReportDto: CreateReportDto) {
    const res = await this.reportService.create(createReportDto);
    return {
      message: 'Create report success!',
      data: res,
    };
  }

  @Get('target')
  getReportList(
    @Query('targetId') targetId: string,
    @Query('targetType') targetType: ContentServiceType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size = 10,
  ) {
    return this.reportService.findByTarget(
      Number(targetId),
      targetType,
      Number(page),
      Number(size),
    );
  }

  @Get()
  findByTarget(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size = 10,
    @Query('keyword') keyword?: string,
  ) {
    return this.reportService.getReportList(
      Number(page),
      Number(size),
      keyword,
    );
  }

  @Delete()
  removeMany(@Body('ids') ids: number[]) {
    return this.reportService.removeMany(ids);
  }
}
