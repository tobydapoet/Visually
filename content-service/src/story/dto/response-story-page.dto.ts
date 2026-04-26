import { StoryResponseDto, StorySummaryReponseDto } from './response-story.dto';

export class StoryResponsePageDto {
  page!: number;
  size!: number;
  total!: number;
  content!: StoryResponseDto[];
}

export class StorySummaryResponsePageDto {
  page!: number;
  size!: number;
  total!: number;
  content!: StorySummaryReponseDto[];
}
