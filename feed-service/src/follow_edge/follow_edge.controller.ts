import { Controller } from '@nestjs/common';
import { FollowEdgeService } from './follow_edge.service';
import { EventPattern } from '@nestjs/microservices';
import { FollowEvent } from './dto/event-follow_edege.dto';

@Controller('follow-edge')
export class FollowEdgeController {
  constructor(private readonly followEdgeService: FollowEdgeService) {}

  @EventPattern('follow.created')
  create(followEvent: FollowEvent) {
    return this.followEdgeService.create(followEvent);
  }

  @EventPattern('follow.deleted')
  remove(followEvent: FollowEvent) {
    return this.followEdgeService.remove(followEvent);
  }
}
