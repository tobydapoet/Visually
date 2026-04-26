import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ContentFeedReponseDto } from 'src/feed/dto/response-content.dto';

@Injectable()
export class ContentClient {
  constructor(private readonly http: HttpService) {}

  async getRecentByUserId(userId: string): Promise<ContentFeedReponseDto[]> {
    const res = await firstValueFrom(
      this.http.get(
        `${process.env.CONTENT_SERVICE_URL}/content/recent/${userId}`,
      ),
    );
    return res.data;
  }

  async getContent(
    size = 20,
    page = 1,
    tags: string[],
    userId: string,
  ): Promise<ContentFeedReponseDto[]> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.CONTENT_SERVICE_URL}/content/feed`, {
        params: new URLSearchParams([
          ...tags.map((tag) => ['tags', tag]),
          ['page', String(page)],
          ['size', String(size)],
        ]),
        headers: {
          'X-User-Id': userId.toString(),
        },
      }),
    );
    return res.data;
  }
}
