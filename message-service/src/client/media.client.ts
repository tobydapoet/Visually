import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MediaResponse } from './dto/MediaResponse.dto';
import { Express } from 'express';

@Injectable()
export class MediaClient {
  constructor(private readonly http: HttpService) {}

  async upload(
    files: Express.Multer.File[],
    userId: string,
    sessionId: number,
  ): Promise<MediaResponse[]> {
    const res = await firstValueFrom(
      this.http.post('http://MEDIA-SERVICE/media_file', files, {
        headers: {
          'X-User-Id': userId,
          'X-Session-Id': sessionId,
        },
        params: 'message',
      }),
    );

    return res.data;
  }

  async delete(
    userId: string,
    sessionId: number,
    urlIds: number[],
  ): Promise<void> {
    await firstValueFrom(
      this.http.delete(`http://MEDIA-SERVICE/media_file`, {
        data: {
          urlIds,
        },
        headers: {
          'X-User-Id': userId,
          'X-Session-Id': sessionId,
        },
      }),
    );
  }
}
