import { ContentStatus } from 'src/enums/content_status.type';
import { MentionResponse } from 'src/mention/dto/response-mentions.dto';
import { Tag } from 'src/tag/entities/tag.entity';

export class ShortResponseDto {
  id!: number;
  userId!: string;
  username!: string;
  avatarUrl?: string;
  caption?: string;
  thumbnailUrl!: string;
  mediaUrl?: string;
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
