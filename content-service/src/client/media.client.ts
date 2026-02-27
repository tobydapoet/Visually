import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MediaResponse } from './dto/MediaResponse.dto';
import { MusicResponse } from './dto/MusicResponse.dto';
const FormData = require('form-data');

@Injectable()
export class MediaClient {
  private readonly logger = new Logger(MediaClient.name);

  constructor(private readonly http: HttpService) {}

  async upload(
    files: Express.Multer.File[],
    folder: string,
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
    this.logger.debug(`[upload] POST ${url}`);
    this.logger.debug(`[upload] folder: ${folder}, userId: ${userId}`);
    this.logger.debug(
      `[upload] files: ${files.map((f) => `${f.originalname} (${f.mimetype}, ${f.size} bytes)`).join(', ')}`,
    );

    try {
      const res = await firstValueFrom(
        this.http.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            'X-User-Id': userId,
          },
          params: { folder },
        }),
      );
      this.logger.debug(`[upload] Response: ${JSON.stringify(res.data)}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`[upload] Status: ${error.response?.status}`);
      this.logger.error(
        `[upload] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      this.logger.error(
        `[upload] Headers sent: ${JSON.stringify(error.config?.headers)}`,
      );
      throw error;
    }
  }

  async delete(userId: string, urlIds: number[]): Promise<void> {
    const url = `${process.env.MEDIA_SERVICE_URL}/media_file`;
    this.logger.debug(`[delete] DELETE ${url}`);
    this.logger.debug(`[delete] userId: ${userId}, urlIds: ${urlIds}`);

    try {
      await firstValueFrom(
        this.http.delete(url, {
          data: { urlIds },
          headers: { 'X-User-Id': userId },
        }),
      );
      this.logger.debug(`[delete] Success`);
    } catch (error: any) {
      this.logger.error(`[delete] Status: ${error.response?.status}`);
      this.logger.error(
        `[delete] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }

  async getMany(
    userId: string,
    sessionId: number,
    ids: number[],
  ): Promise<MediaResponse[]> {
    const url = `${process.env.MEDIA_SERVICE_URL}/media_file/many`;
    this.logger.debug(`[getMany] POST ${url}`);
    this.logger.debug(
      `[getMany] userId: ${userId}, sessionId: ${sessionId}, ids: ${ids}`,
    );

    try {
      const res = await firstValueFrom(
        this.http.post(url, ids, {
          headers: {
            'X-User-Id': userId,
            'X-Session-Id': sessionId,
          },
        }),
      );
      this.logger.debug(`[getMany] Response: ${JSON.stringify(res.data)}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`[getMany] Status: ${error.response?.status}`);
      this.logger.error(
        `[getMany] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }

  async getOne(userId: string, id: number): Promise<MediaResponse> {
    const url = `${process.env.MEDIA_SERVICE_URL}/media_file/${id}`;
    this.logger.debug(`[getOne] GET ${url}`);
    this.logger.debug(`[getOne] userId: ${userId}, id: ${id}`);

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-User-Id': userId },
        }),
      );
      this.logger.debug(`[getOne] Response: ${JSON.stringify(res.data)}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`[getOne] Status: ${error.response?.status}`);
      this.logger.error(
        `[getOne] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }

  async getMusic(userId: string, id: number): Promise<MusicResponse> {
    const url = `${process.env.MEDIA_SERVICE_URL}/music_library/${id}`;
    this.logger.debug(`[getMusic] GET ${url}`);
    this.logger.debug(`[getMusic] userId: ${userId}, id: ${id}`);

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-User-Id': userId },
        }),
      );
      this.logger.debug(`[getMusic] Response: ${JSON.stringify(res.data)}`);
      return res.data;
    } catch (error: any) {
      this.logger.error(`[getMusic] Status: ${error.response?.status}`);
      this.logger.error(
        `[getMusic] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }
}
