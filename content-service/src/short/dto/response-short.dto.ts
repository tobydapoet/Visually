import { ContentStatus } from 'src/enums/content_status.type';
import { Tag } from 'src/tag/entities/tag.entity';

export class ShortResponseDto {
  id!: number;

  userId!: string;

  username!: string;

  avatarUrl?: string;

  caption?: string;

  thumbnailUrl!: string;

  musicUrl?: string | null;

  mediaUrl?: string;

  likeCount!: number;

  commentCount!: number;

  sharedCount!: number;

  status!: ContentStatus;

  createdAt!: Date;

  tags?: Tag[];
}
