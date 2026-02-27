import { IsArray, IsString } from 'class-validator';

export class UpdateShortDto {
  @IsString({
    message: 'caption must be a string',
  })
  caption!: string;

  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsNameAdd!: string[];

  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tagsIdRemove!: number[];
}
