import { CommentTargetType } from 'src/enums/ContentType';

export class CommentSummary {
  id!: number;

  userId!: string;

  username!: string;

  avatarUrl?: string;

  targetId!: number;

  targetType!: CommentTargetType;
}
