import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Share')
@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createShareDto: CreateShareDto,
    @Param('userId') userId: string,
  ) {
    return this.shareService.create(createShareDto, userId);
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  findByUser(
    @Param('userId') userId: string,
    @Query('public') isPublic: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    return this.shareService.findByUser(userId, page, size, isPublic);
  }

  @ApiBearerAuth()
  @Patch(':id/toggle-public')
  togglePublic(@Param('id', ParseIntPipe) id: number) {
    return this.shareService.togglePublic(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.shareService.remove(userId, id);
  }

  @EventPattern('user.updated.avatar')
  updateAvarUrl(@Payload() data: { id: string; avatarUrl: string }) {
    return this.shareService.updateAvatarUrl(data.id, data.avatarUrl);
  }
}
