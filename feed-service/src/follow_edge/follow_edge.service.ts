import { Injectable } from '@nestjs/common';
import { FollowEvent } from './dto/event-follow_edege.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FollowEdge } from './entities/follow_edge.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FollowEdgeService {
  constructor(
    @InjectRepository(FollowEdge)
    private followEdgeRepo: Repository<FollowEdge>,
  ) {}

  findByFollowedId(id: string) {
    return this.followEdgeRepo.find({
      where: { followedId: id },
      select: ['followerId'],
    });
  }

  create(followEvent: FollowEvent) {
    return this.followEdgeRepo.insert({
      followerId: followEvent.followerId,
      followedId: followEvent.followedId,
    });
  }

  remove(followEvent: FollowEvent) {
    return this.followEdgeRepo.delete({
      followerId: followEvent.followerId,
      followedId: followEvent.followedId,
    });
  }
}
