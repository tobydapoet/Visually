import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ContentServiceType } from 'src/enums/ContentType';
import { ReportReason } from 'src/enums/ReportReason';

export class CreateReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  targetId!: number;

  @ApiProperty({
    enum: ContentServiceType,
    enumName: 'ContentServiceType',
  })
  @IsNotEmpty()
  @IsEnum(ContentServiceType)
  targetType!: ContentServiceType;

  @ApiProperty({
    enum: ReportReason,
    enumName: 'ReportReason',
  })
  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason!: ReportReason;
}
