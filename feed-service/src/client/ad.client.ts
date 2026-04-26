import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdFeedResponse } from './dtos/adFeedReponse';
import { Gender } from 'src/enmum/Gender.enum';

@Injectable()
export class AdClient {
  constructor(private readonly http: HttpService) {}

  async getAdFeeds(
    age: number = 12,
    gender: Gender = 'MALE' as Gender,
  ): Promise<AdFeedResponse[]> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.AD_SERVICE_URL}/ad/feed`, {
        params: {
          age,
          gender,
        },
      }),
    );
    return res.data;
  }
}
