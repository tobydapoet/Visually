import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ContentFeedReponseDto } from 'src/feed/dto/response-content.dto';
import { UserResponse } from './dtos/user-response.dto';

@Injectable()
export class Userclient {
  constructor(private readonly http: HttpService) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.USER_SERVICE_URL}/account/current`, {
        headers: {
          'X-User-Id': userId.toString(),
        },
      }),
    );

    return res.data;
  }
}
