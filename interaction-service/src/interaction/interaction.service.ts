import { Injectable } from '@nestjs/common';
import { CommentService } from 'src/comment/comment.service';
import { ContextService } from 'src/context/context.service';
import {
  CommentTargetType,
  ContentServiceType,
  ContentType,
  LikeTargetType,
} from 'src/enums/ContentType';
import { LikeService } from 'src/like/like.service';
import { ShareService } from 'src/share/share.service';

@Injectable()
export class InteractionService {
  constructor(
    private likeService: LikeService,
    private commentService: CommentService,
    private shareService: ShareService,
    private context: ContextService,
  ) {}

  async getUserInteractions(
    targetIds: number[],
    targetType: ContentServiceType,
  ) {
    const userId = this.context.getUserId();
    const isStory = targetType === ContentServiceType.STORY;

    const [likedIds, commentedIds, sharedIds, savedIds] = await Promise.all([
      this.likeService.getLikedIds(
        userId,
        targetIds,
        targetType as unknown as LikeTargetType,
      ),

      isStory
        ? Promise.resolve([])
        : this.commentService.getCommentedIds(
            userId,
            targetIds,
            targetType as unknown as CommentTargetType,
          ),

      isStory
        ? Promise.resolve([])
        : this.shareService.getSharedIds(
            userId,
            targetIds,
            targetType as unknown as ContentType,
            true,
          ),

      isStory
        ? Promise.resolve([])
        : this.shareService.getSharedIds(
            userId,
            targetIds,
            targetType as unknown as ContentType,
            false,
          ),
    ]);

    return targetIds.map((id) => ({
      targetId: id,
      isLiked: likedIds.includes(id),
      isCommented: commentedIds.includes(id),
      isShared: sharedIds.includes(id),
      isSaved: savedIds.includes(id),
    }));
  }
}
