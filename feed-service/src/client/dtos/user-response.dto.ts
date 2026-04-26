import { Gender } from 'src/enmum/Gender.enum';

export class UserResponse {
  userId!: string;
  gender!: Gender;
  dob?: Date;
}
