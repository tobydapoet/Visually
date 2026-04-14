export class StoryResponseDto {
  id!: number;
  userId!: string;
  username!: string;
  avatarUrl?: string;
  mediaUrl?: string;
  musicUrl?: string;
  expiredAt!: Date;
  createdAt!: Date;
  startMusicTime?: number;
  storageId?: number | null;
  likeCount!: number;
  isLiked!: boolean;
  isCommented!: boolean;
  isSaved!: boolean;
}
