export class ShortResponsePageDto {
  page!: number;
  size!: number;
  total!: number;
  content!: {
    id: number;
    username: string;
    avatarUrl?: string;
    userId: string;
    caption?: string;
    thumbnailUrl: string;
    likeCount: number;
    commentCount: number;
    saveCount: number;
    isLiked: boolean;
    isCommented: boolean;
    isSaved: boolean;
  }[];
}
