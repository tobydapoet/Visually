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
}
