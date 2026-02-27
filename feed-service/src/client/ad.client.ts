import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdFeedResponse } from './dtos/adFeedReponse';
import { ContentType } from 'src/enums/ContentType';

@Injectable()
export class AdClient {
  constructor(private readonly http: HttpService) {}

  async getAdFeeds(
    userId: string,
    size: number,
    type: ContentType,
  ): Promise<AdFeedResponse[]> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.ADS_SERVICE_URL}/ads/feed`, {
        headers: {
          'X-User-Id': userId.toString(),
        },
        params: {
          size,
          type,
        },
      }),
    );

    return res.data;
  }
}
