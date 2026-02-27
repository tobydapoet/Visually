import { UUID } from 'crypto';
import { ContentStatus } from 'src/enums/content_status.type';
import { MediaResponse } from 'src/client/dto/MediaResponse.dto';
import { Tag } from 'src/tag/entities/tag.entity';

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

  shareCount!: number;

  status!: ContentStatus;

  createdAt!: Date;

  tags?: Tag[];
}
