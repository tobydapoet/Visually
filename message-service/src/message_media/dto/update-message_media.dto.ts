import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageMediaDto } from './create-message_media.dto';

export class UpdateMessageMediaDto extends PartialType(CreateMessageMediaDto) {}
