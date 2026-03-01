import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AttachmentType } from '../enums/attachment.type';
import { ContentResponse } from './dto/response-content.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ContentClient {
  constructor(private readonly http: HttpService) {}

  async getContent(
    targetId: number,
    targetType: AttachmentType,
  ): Promise<ContentResponse> {
    switch (targetType) {
      case AttachmentType.POST: {
        const { data } = await firstValueFrom(
          this.http.get(`${process.env.CONTENT_SERVICE_URL}/post/${targetId}`),
        );
        return {
          id: data.id,
          caption: data.caption,
          mediaUrl: data.medias[0].url,
          username: data.username,
          avatarUrl: data.avatarUrl,
        };
      }
      case AttachmentType.SHORT: {
        const { data } = await firstValueFrom(
          this.http.get(`${process.env.CONTENT_SERVICE_URL}/short/${targetId}`),
        );
        return {
          id: data.id,
          caption: data.caption,
          mediaUrl: data.thumbnailUrl,
          username: data.username,
          avatarUrl: data.avatarUrl,
        };
      }
      case AttachmentType.STORY: {
        const { data } = await firstValueFrom(
          this.http.get(`${process.env.CONTENT_SERVICE_URL}/story/${targetId}`),
        );
        return {
          id: data.id,
          mediaUrl: data.mediaUrl,
          username: data.username,
          avatarUrl: data.avatarUrl,
        };
      }
    }
  }
}
