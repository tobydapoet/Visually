import { IsArray, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds!: string[];
}
