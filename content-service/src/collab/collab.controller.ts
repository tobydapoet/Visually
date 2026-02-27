import {
  Controller,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { CollabService } from './collab.service';
import { ContentType } from 'src/enums/content.type';

@Controller('collab')
export class CollabController {
  constructor(private readonly collabService: CollabService) {}

  @Patch('accept')
  acceptCollab(
    @Query('targetId', ParseIntPipe) targetId: number,
    @Query('type', new ParseEnumPipe(ContentType)) type: ContentType,
  ) {
    return this.collabService.acceptCollab(targetId, type);
  }

  @Delete()
  removeCollab(
    @Query('targetId', ParseIntPipe) targetId: number,
    @Query('type', new ParseEnumPipe(ContentType)) type: ContentType,
  ) {
    return this.collabService.removeCollab(targetId, type);
  }
}
