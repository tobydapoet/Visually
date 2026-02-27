import { IsNumber, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateStoryDto {
  @IsOptional()
  @IsNumber({}, { message: 'musicId must be a number' })
  musicId?: number;
}
