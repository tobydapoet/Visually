import { InteractionResponse } from 'src/client/dto/InteractionResponse.dto';

export class PostResponsePageDto {
  page!: number;
  size!: number;
  total!: number;
  content!: {
    id: number;
    caption?: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    mediaUrl?: string;
    isLiked: boolean;
    isCommented: boolean;
    isShared: boolean;
    isSaved: boolean;
  }[];
}
