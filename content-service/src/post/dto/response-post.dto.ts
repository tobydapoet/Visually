import { UUID } from 'crypto';
import { ContentStatus } from 'src/enums/content_status.type';
import { MediaResponse } from 'src/client/dto/MediaResponse.dto';
import { Tag } from 'src/tag/entities/tag.entity';
import { MentionResponse } from 'src/mention/dto/response-mentions.dto';

export class PostResponseDto {
  id!: number;
  userId!: string;
  username!: string;
  avatarUrl?: string;
  caption?: string;
  musicUrl?: string;
  medias?: MediaResponse[];
  likeCount!: number;
  commentCount!: number;
  saveCount!: number;
  repostCount!: number;
  createdAt!: Date;
  tags?: Tag[];
  mentions?: MentionResponse[];
  isLiked!: boolean;
  isCommented!: boolean;
  isSaved!: boolean;
  isReposted!: boolean;
}
