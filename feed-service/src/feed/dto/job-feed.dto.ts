import { ContentType } from 'src/enums/ContentType';
import { FeedSource } from 'src/enums/FeedSource';
import { InteractionContentType } from 'src/enums/interaction.type';

export class PostContentJobData {
  contentId!: number;
  authorId!: string;
  createdAt!: string;
  type!: ContentType;
}

export class ActivityJobData {
  contentId!: number;
  contentType!: ContentType;

  actorId!: string;
  activityType!: InteractionContentType;

  source!: FeedSource;
}

export class DeleteContentJobData {
  contentId!: number;
  type!: ContentType;
}

export class DeleteContentWithSourceJobData {
  actorId!: string;
  type!: ContentType;
  source!: FeedSource;
}
