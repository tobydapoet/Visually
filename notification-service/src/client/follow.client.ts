import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export class FollowClient {
  constructor(private readonly http: HttpService) {}

  async getFollowers(userId: string, page: number, size: number) {
    const res = await firstValueFrom(
      this.http.get(`${process.env.FOLLOW_SERVICE_URL}/follow/followers`, {
        headers: {
          'X-User-Id': userId.toString(),
        },
        params: {
          followerId: userId,
          size,
          page,
        },
      }),
    );
    return res.data;
  }
}
