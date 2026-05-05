import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ContentServiceType } from 'src/enums/ContentType';
import { InteractionService } from './interaction.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('interaction')
export class InteractionController {
  constructor(private interactionService: InteractionService) {}

  @Get()
  async getUserInteraction(
    @Query('targetIds') targetIds: string,
    @Query('type', new ParseEnumPipe(ContentServiceType))
    targetType: ContentServiceType,
  ) {
    const ids = targetIds.split(',').map(Number);
    return this.interactionService.getUserInteractions(ids, targetType);
  }

  @EventPattern('user.updated.profile')
  updateAvarUrl(
    @Payload() data: { id: string; avatarUrl: string; username: string },
  ) {
    return this.interactionService.updateUserDetail(
      data.id,
      data.avatarUrl,
      data.username,
    );
  }
}
