import { ContentType } from 'src/enums/content.type';
import { MentionResponse } from 'src/mention/dto/response-mentions.dto';

export class DefaultReponseDto {
  id!: number;
  caption?: string;
  userId!: string;
  username!: string;
  avatarUrl?: string;
  likeCount!: number;
  commentCount!: number;
  saveCount!: number;
  repostCount!: number;
  thumbnailUrl?: string;
  isLiked!: boolean;
  isCommented!: boolean;
  isSaved!: boolean;
  isReposted!: boolean;
  mentions?: MentionResponse[];
}

export class DefaultSummaryReponseDto {
  id!: number;
  userId!: string;
  likeCount!: number;
  commentCount!: number;
  thumbnailUrl?: string;
  type!: ContentType;
  createdAt!: Date;
}

export class FeedReponseDto {
  contentId!: number;
  contentType!: ContentType;
  createdAt!: Date;
}

export class ContentManageReponse {
  id!: number;
  caption?: string;

  userId!: string;
  username!: string;
  avatarUrl?: string;

  thumbnailUrl?: string;

  createdAt!: Date;
  updatedAt?: Date;

  mentions?: MentionResponse[];
}

export class ContentManagePageReponse {
  content!: ContentManageReponse[];
  page!: number;
  size!: number;
  total!: number;
}
