import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserDto } from './dto/user-response.dto';

@Injectable()
export class UserClient {
  constructor(private readonly http: HttpService) {}

  async getUser(userId: string): Promise<UserDto> {
    const res = await firstValueFrom(
      this.http.get(`http://USER-SERVICE/account/summary/${userId}`),
    );
    return res.data;
  }
}
