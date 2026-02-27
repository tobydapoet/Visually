import { PartialType } from '@nestjs/mapped-types';
import { CreateContentEdgeDto } from './create-content_edge.dto';

export class UpdateContentEdgeDto extends PartialType(CreateContentEdgeDto) {}
