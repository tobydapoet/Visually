import { Module } from '@nestjs/common';
import { FollowEdgeService } from './follow_edge.service';
import { FollowEdgeController } from './follow_edge.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowEdge } from './entities/follow_edge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowEdge])],
  controllers: [FollowEdgeController],
  providers: [FollowEdgeService],
  exports: [FollowEdgeService],
})
export class FollowEdgeModule {}
