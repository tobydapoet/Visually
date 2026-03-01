import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserDto } from './dto/response-user.dto';

@Injectable()
export class UserClient {
  constructor(private readonly http: HttpService) {}

  async getUsers(userIds: string[]): Promise<UserDto[]> {
    const res = await firstValueFrom(
      this.http.get(
        `${process.env.USER_SERVICE_URL}/account/batch/${userIds.join(',')}`,
      ),
    );
    return res.data;
  }
}
