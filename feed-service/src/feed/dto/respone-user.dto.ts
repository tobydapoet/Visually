import { Gender } from 'src/enmum/Gender.enum';

export class UserResponse {
  id!: string;

  dob?: Date;

  gender?: Gender;
}
