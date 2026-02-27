import { IsArray, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsString({
    message: 'caption must be a string',
  })
  caption?: string;

  @IsNumber(
    {},
    {
      message: 'musicId must be a number',
    },
  )
  musicId?: number;

  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsName?: string[];

  @IsArray()
  @IsUUID('4', {
    message: 'collabUserId must be a valid UUID',
  })
  collabUserId!: string[];
}
