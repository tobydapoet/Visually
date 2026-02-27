export class StoryResponseDto {
  id!: number;

  userId!: string;

  username!: string;

  avatarUrl?: string;

  mediaUrl?: string;

  musicUrl?: string;

  expiredAt!: Date;

  createdAt!: Date;
}
