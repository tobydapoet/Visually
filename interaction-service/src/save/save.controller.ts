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
import { SaveService } from './save.service';
import { CreateSaveDto } from './dto/create-save.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContentType } from 'src/enums/ContentType';

@ApiTags('Save')
@Controller('save')
export class SaveController {
  constructor(private readonly saveService: SaveService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSaveDto: CreateSaveDto) {
    return this.saveService.create(createSaveDto);
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 10 })
  findByUser(
    @Query('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    return this.saveService.findByUser(userId, page, size);
  }

  @Delete()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Query('targetId', ParseIntPipe) targetId: number,
    @Query('targetType', new ParseEnumPipe(ContentType))
    targetType: ContentType,
  ) {
    return this.saveService.remove(targetId, targetType);
  }
}
