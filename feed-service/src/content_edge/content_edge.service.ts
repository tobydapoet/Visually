import { Injectable, NotFoundException } from '@nestjs/common';
import { InteractionType } from 'src/enums/interaction.type';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentEdge } from './entities/content_edge.entity';
import { Repository } from 'typeorm';
import { ContentType } from 'src/enums/ContentType';
import { CreateContentEdgeDto } from './dto/create-content_edge.dto';
import { ContentStatus } from 'src/enums/ContentStatus';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ContentEdgeService {
  constructor(
    @InjectRepository(ContentEdge) private contentRepo: Repository<ContentEdge>,
  ) {}

  async create(dto: CreateContentEdgeDto) {
    const newContent = this.contentRepo.create(dto);
    return this.contentRepo.save(newContent);
  }

  async getTrending(limit = 20) {
    return this.contentRepo
      .createQueryBuilder('c')
      .addSelect(
        `
      (
        (c.likeCount * 1 +
         c.commentCount * 3 +
         c.shareCount * 5)
        /
        POW(TIMESTAMPDIFF(HOUR, c.createdAt, NOW()) + 2, 1.5)
      )
    `,
        'trendingScore',
      )
      .where('c.createdAt > NOW() - INTERVAL 48 HOUR')
      .orderBy('trendingScore', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findOne(contentId: number, contentType: ContentType) {
    return this.contentRepo.findOne({ where: { contentId, contentType } });
  }

  async getTrendingNotInFeed(userId: string, type: ContentType, limit: number) {
    return this.contentRepo
      .createQueryBuilder('c')
      .where('c.status = :status', { status: 'ACTIVE' })
      .where('c.contentType= :type', { type })
      .andWhere('c.createdAt > NOW() - INTERVAL 48 HOUR')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('f.contentId')
          .from('feed', 'f')
          .where('f.userId = :userId')
          .getQuery();
        return 'c.contentId NOT IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .orderBy('c.trendingScore', 'DESC')
      .limit(limit)
      .getMany();
  }

  async updateInteraction(
    contentId: number,
    contentType: ContentType,
    action: InteractionType,
  ) {
    const content = await this.contentRepo.findOne({
      where: { contentId, contentType },
    });

    if (!content) {
      throw new NotFoundException(`Content not found!`);
    }

    switch (action) {
      case InteractionType.COMMENT:
        content.commentCount += 1;
        break;

      case InteractionType.LIKE:
        content.likeCount += 1;
        break;

      case InteractionType.SHARE:
        content.shareCount += 1;
        break;

      case InteractionType.UNLIKE:
        if (content.likeCount > 0) content.likeCount -= 1;
        break;

      case InteractionType.UNSHARE:
        if (content.shareCount > 0) content.shareCount -= 1;
        break;
    }

    await this.contentRepo.save(content);
  }

  async updateStatus(
    contentId: number,
    contentType: ContentType,
    status: ContentStatus,
  ) {
    const content = await this.contentRepo.findOne({
      where: { contentId, contentType },
    });
    if (!content) {
      throw new NotFoundException("Can't find this content");
    }
    content.status = status;
    return this.contentRepo.save(content);
  }

  async decreaseCommentInteraction(
    contentId: number,
    contentType: ContentType,
    num: number,
  ) {
    const result = await this.contentRepo.decrement(
      { contentId, contentType },
      'commentCount',
      num,
    );

    if (result.affected === 0) {
      throw new NotFoundException('Short not found!');
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateTrendingScore() {
    console.log('Updating trending scores...');

    await this.contentRepo.query(`
      UPDATE content_edge c
      SET c.trendingScore =
      (
        (c.likeCount * 1 +
         c.commentCount * 3 +
         c.shareCount * 5)
        /
        POW(TIMESTAMPDIFF(HOUR, c.createdAt, NOW()) + 2, 1.5)
      )
      WHERE c.createdAt > NOW() - INTERVAL 48 HOUR
    `);
  }
}
