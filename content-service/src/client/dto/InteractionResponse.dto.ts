export class InteractionResponse {
  targetId!: number;
  isLiked!: boolean;
  isCommented!: boolean;
  isSaved!: boolean;
}

export class ViewResponse {
  storyId!: number;
  isViewed!: boolean;
}
