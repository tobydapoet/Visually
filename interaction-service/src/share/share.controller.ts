import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  Put,
  ParseEnumPipe,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContentType } from 'src/enums/ContentType';

@ApiTags('Share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createShareDto: CreateShareDto) {
    return this.shareService.create(createShareDto);
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  findByUser(
    @Query('userId') userId: string,
    @Query('public') isPublic: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    return this.shareService.findByUser(userId, page, size, isPublic);
  }

  @ApiBearerAuth()
  @Put(':id/toggle-public')
  togglePublic(@Param('id', ParseIntPipe) id: number) {
    return this.shareService.togglePublic(id);
  }

  @Delete()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Query('targetId', ParseIntPipe) targetId: number,
    @Query('targetType', new ParseEnumPipe(ContentType))
    targetType: ContentType,
  ) {
    return this.shareService.remove(targetId, targetType);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.shareService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
