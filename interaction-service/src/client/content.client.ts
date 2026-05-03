import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ContentDto } from './dto/user-response.dto';
import { ContentServiceType } from 'src/enums/ContentType';

@Injectable()
export class ContentClient {
  constructor(private readonly http: HttpService) {}

  async getPost(postId: number): Promise<ContentDto> {
    const url = `${process.env.CONTENT_SERVICE_URL}/post/${postId}`;
    const res = await firstValueFrom(this.http.get<ContentDto>(url));
    return res.data;
  }

  async getShort(shortId: number): Promise<ContentDto> {
    const url = `${process.env.CONTENT_SERVICE_URL}/short/${shortId}`;
    const res = await firstValueFrom(this.http.get<ContentDto>(url));
    return res.data;
  }

  async getStory(storyId: number): Promise<ContentDto> {
    const url = `${process.env.CONTENT_SERVICE_URL}/story/${storyId}`;
    const res = await firstValueFrom(this.http.get<ContentDto>(url));
    return res.data;
  }

  async verifyTarget(
    userId: string,
    contentId: number,
    contentType: ContentServiceType,
  ): Promise<boolean> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.CONTENT_SERVICE_URL}/content/target-id`, {
        params: {
          contentId,
          contentType,
        },
        headers: {
          'x-user-id': userId,
        },
      }),
    );
    return res.data;
  }
}
