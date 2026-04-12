import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ContentServiceType } from 'src/enums/ContentType';
import { InteractionService } from './interaction.service';

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
}
