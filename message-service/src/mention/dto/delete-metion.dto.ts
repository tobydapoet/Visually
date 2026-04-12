import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeleteMentionDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  messageId!: number;
}
