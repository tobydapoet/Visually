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

    shareCount: number;
  }[];
}
