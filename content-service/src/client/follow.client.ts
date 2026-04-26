import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FollowResponse } from './dto/FollowResponse.dto';

@Injectable()
export class FollowClient {
  constructor(private readonly http: HttpService) {}

  async getCurrentFollowed(
    userId: string,
    page: number = 1,
    size: number = 20,
  ): Promise<FollowResponse> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.FOLLOW_SERVICE_URL}/follow/current`, {
        headers: {
          'x-user-id': userId.toString(),
        },
        params: {
          page,
          size,
          type: 'FOLLOWED',
        },
      }),
    );

    return res.data;
  }

  async getCurrentBlockers(userId: string): Promise<string[]> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.FOLLOW_SERVICE_URL}/block/current`, {
        headers: {
          'x-user-id': userId.toString(),
        },
      }),
    );

    return res.data;
  }
}
