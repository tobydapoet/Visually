import { Controller, forwardRef, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserInterestService } from './user_interest.service';
import {
  ContentInteractionEvent,
  ContentViewEvent,
} from './dto/event-content_interaction.dto';

@Controller()
export class UserInterestConsumer {
  constructor(private readonly userInterestService: UserInterestService) {}

  @EventPattern('content.liked')
  async handleContentLiked(@Payload() data: ContentInteractionEvent) {
    await this.userInterestService.trackInterest(data, 1);
  }

  @EventPattern('content.commented')
  async handleContentCommented(@Payload() data: ContentInteractionEvent) {
    await this.userInterestService.trackInterest(data, 2);
  }

  @EventPattern('content.viewed')
  async handleContentView(@Payload() data: ContentViewEvent) {
    await this.userInterestService.handleView(data);
  }
}
