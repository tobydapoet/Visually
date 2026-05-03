import { IsString, IsUUID } from 'class-validator';

export default class UserBatch {
  @IsUUID()
  id!: string;

  @IsString()
  username!: string;
}
