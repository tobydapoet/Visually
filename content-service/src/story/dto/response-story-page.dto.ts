import { StoryResponseDto } from './response-story.dto';

export class StoryResponsePageDto {
  page!: number;
  size!: number;
  total!: number;
  content!: StoryResponseDto[];
}
