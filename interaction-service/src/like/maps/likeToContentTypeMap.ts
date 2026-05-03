import { ContentServiceType, LikeTargetType } from 'src/enums/ContentType';

export const likeToContentTypeMap: Partial<
  Record<LikeTargetType, ContentServiceType>
> = {
  [LikeTargetType.POST]: ContentServiceType.POST,
  [LikeTargetType.SHORT]: ContentServiceType.SHORT,
  [LikeTargetType.STORY]: ContentServiceType.STORY,
};
