import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds!: string[];
}
