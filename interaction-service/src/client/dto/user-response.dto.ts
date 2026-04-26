export class ContentDto {
  avatarUrl?: string;
  userId!: string;
  username!: string;
  likeCount!: number;
  commentCount?: number;
  saveCount?: number;
  tags?: {
    id: number;
    name: string;
  }[];
  caption?: string;
}

export class UserDto {
  avatarUrl?: string;
  userId!: string;
  username!: string;
}
