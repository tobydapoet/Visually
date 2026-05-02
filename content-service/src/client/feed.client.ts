import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FeedPageResponse } from './dto/FeedResponse.dto';

@Injectable()
export class FeedClient {
  constructor(private readonly http: HttpService) {}

  async getReelFeed(
    userId: string,
    take?: number,
    cursor?: string,
  ): Promise<FeedPageResponse> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.FEED_SERVICE_URL}/feed/reels`, {
        params: {
          cursor,
          take,
        },
        headers: {
          'x-user-id': userId.toString(),
        },
      }),
    );
    return res.data;
  }

  async getHomeFeed(
    userId: string,
    take?: number,
    cursor?: string,
  ): Promise<FeedPageResponse> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.FEED_SERVICE_URL}/feed/home`, {
        params: {
          cursor,
          take,
        },
        headers: {
          'x-user-Id': userId.toString(),
        },
      }),
    );

    return res.data;
  }
}
