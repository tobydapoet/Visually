import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FollowClient {
  constructor(private readonly http: HttpService) {}

  async validateBlock(
    userId: string,
    sessionId: number,
    blockerId: string,
  ): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.get<{ isFollowedNoBlock: boolean }>(
        `${process.env.FOLLOW_SERVICE_URL}/follow/check-follow-no-block`,
        {
          headers: {
            'X-User-Id': userId.toString(),
            'X-Session-Id': sessionId.toString(),
          },
          params: {
            userId: userId.toString(),
            targetUserId: blockerId.toString(),
          },
        },
      ),
    );

    return res.data.isFollowedNoBlock;
  }
}
