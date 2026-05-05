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
import { ReportService } from 'src/report/report.service';
import { SaveService } from 'src/save/save.service';

@Injectable()
export class InteractionService {
  constructor(
    private likeService: LikeService,
    private commentService: CommentService,
    private saveService: SaveService,
    private reportService: ReportService,
    private context: ContextService,
  ) {}

  async getUserInteractions(
    targetIds: number[],
    targetType: ContentServiceType,
  ) {
    const userId = this.context.getUserId();
    const isStory = targetType === ContentServiceType.STORY;

    const [likedIds, commentedIds, savedIds] = await Promise.all([
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
        : this.saveService.getSavedIds(
            userId,
            targetIds,
            targetType as unknown as ContentType,
          ),
    ]);

    return targetIds.map((id) => ({
      targetId: id,
      isLiked: likedIds.includes(id),
      isCommented: commentedIds.includes(id),
      isSaved: savedIds.includes(id),
    }));
  }

  async updateUserDetail(userId: string, avatarUrl: string, username: string) {
    await this.likeService.updateUserDetail(userId, avatarUrl, username);
    await this.commentService.updateUserDetail(userId, avatarUrl, username);
    await this.saveService.updateUserDetail(userId, avatarUrl, username);
    await this.reportService.updateUserDetail(userId, avatarUrl, username);
  }
}
