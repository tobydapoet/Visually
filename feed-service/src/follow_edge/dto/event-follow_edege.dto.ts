import { IsNotEmpty, IsUUID } from 'class-validator';

export class FollowEvent {
  @IsNotEmpty()
  @IsUUID()
  followerId!: string;

  @IsNotEmpty()
  @IsUUID()
  followedId!: string;
}
