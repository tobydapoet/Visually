import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ContextService } from 'src/context/context.service';
import { ContentServiceType, ContentType } from 'src/enums/ContentType';
import { ContentCacheService } from 'src/content-cache/content-cache.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    private context: ContextService,
    private contentCacheService: ContentCacheService,
  ) {}

  async create(createReportDto: CreateReportDto) {
    const userId = this.context.getUserId();
    const avatarUrl = this.context.getAvatarUrl();
    const username = this.context.getUsername();

    const contentTypeMap: Record<ContentType, ContentServiceType> = {
      [ContentType.POST]: ContentServiceType.POST,
      [ContentType.SHORT]: ContentServiceType.SHORT,
    };

    const isValid = await this.contentCacheService.verifyContentWithCache(
      createReportDto.targetId,
      contentTypeMap[createReportDto.targetType],
    );
    if (!isValid) throw new NotFoundException('Content not found');

    const newReport = this.reportRepo.create({
      avatarUrl,
      userId,
      username,
      targetId: createReportDto.targetId,
      targetType: createReportDto.targetType,
      reason: createReportDto.reason,
    });

    return this.reportRepo.save(newReport);
  }

  async findByTarget(
    targetId: number,
    type: ContentServiceType,
    page = 1,
    size = 10,
  ) {
    const [reports, total] = await this.reportRepo.findAndCount({
      where: {
        targetId,
        targetType: type,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: reports,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  async getReportList(page = 1, size = 10, keyword?: string) {
    const where = keyword
      ? [{ username: Like(`%${keyword}%`) }, { reason: Like(`%${keyword}%`) }]
      : {};

    const [reports, total] = await this.reportRepo.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      content: reports,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  removeMany(ids: number[]) {
    return this.reportRepo.delete(ids);
  }
}
