import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MediaResponse } from './dto/MediaResponse.dto';
const FormData = require('form-data');

@Injectable()
export class MediaClient {
  constructor(private readonly http: HttpService) {}

  async upload(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<MediaResponse[]> {
    const formData = new FormData();

    for (const file of files) {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    }

    const url = `${process.env.MEDIA_SERVICE_URL}/media_file`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            'X-User-Id': userId,
          },
          params: { folder: 'message' },
        }),
      );
      return res.data;
    } catch (error: any) {
      throw error;
    }
  }

  async delete(ids: number[], userId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${process.env.MEDIA_SERVICE_URL}/media_file`, {
        data: {
          ids,
        },
        headers: {
          'X-User-Id': userId,
        },
      }),
    );
  }
}
