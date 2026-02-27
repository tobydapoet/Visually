import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedRecommendDto } from './create-feed-recommend.dto';

export class UpdateFeedRecommendDto extends PartialType(CreateFeedRecommendDto) {}
