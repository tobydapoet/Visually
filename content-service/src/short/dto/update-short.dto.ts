import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, IsUUID } from 'class-validator';
import { CreateMentionContentDto } from 'src/mention/dto/create-mention.dto';

export class UpdateShortDto {
  @ApiProperty()
  @IsString({
    message: 'caption must be a string',
  })
  caption?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsNameAdd?: string[];

  @ApiProperty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  tagsIdRemove?: number[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  mentionAdd?: CreateMentionContentDto[];

  @ApiProperty()
  @IsArray()
  @IsUUID('4', { each: true })
  mentionUserIdRemove?: string[];
}
