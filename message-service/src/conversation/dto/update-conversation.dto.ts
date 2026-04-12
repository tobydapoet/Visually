import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  name?: string;
}
