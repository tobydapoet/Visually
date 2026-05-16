import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MediaResponse } from './dto/MediaResponse.dto';
import { MusicResponse } from './dto/MusicResponse.dto';
import { UserRole } from 'src/enums/user_role.type';
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
      this.logger.error(
        `[upload] Response data: ${JSON.stringify(error.response?.data)}`,
      );

      if (error.response?.status === 400) {
        throw new BadRequestException(
          error.response.data?.message || 'Invalid file upload request',
        );
      }

      if (error.response?.status === 413) {
        throw new BadRequestException('File size too large');
      }

      if (error.response?.status === 415) {
        throw new BadRequestException('Unsupported file type');
      }

      throw new InternalServerErrorException('Failed to upload files');
    }
  }

  async delete(userId: string, urlIds: number[]): Promise<void> {
    const url = `${process.env.MEDIA_SERVICE_URL}/media_file`;

    try {
      await lastValueFrom(
        this.http.delete(url, {
          data: urlIds,
          headers: { 'X-User-Id': userId },
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `[delete] Response data: ${JSON.stringify(error.response?.data)}`,
      );
    }
  }

  async getMany(
    userId: string,
    sessionId: number,
    ids: number[],
  ): Promise<MediaResponse[]> {
    const url = `${process.env.MEDIA_SERVICE_URL}/media_file/many`;

    try {
      const res = await firstValueFrom(
        this.http.post(url, ids, {
          headers: {
            'X-User-Id': userId,
            'X-Session-Id': sessionId,
          },
        }),
      );
      return res.data;
    } catch (error: any) {
      this.logger.error(
        `[getMany] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }

  async getOne(userId: string, id: number): Promise<MediaResponse> {
    const url = `${process.env.MEDIA_SERVICE_URL}/media_file/${id}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-User-Id': userId },
        }),
      );
      return res.data;
    } catch (error: any) {
      this.logger.error(
        `[getOne] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }

  async getMusic(
    userId: string,
    role: UserRole,
    id: number,
  ): Promise<MusicResponse> {
    const url = `${process.env.MEDIA_SERVICE_URL}/music_library/${id}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-User-Id': userId, 'X-User-Role': role },
        }),
      );
      return res.data;
    } catch (error: any) {
      this.logger.error(
        `[getMusic] Response data: ${JSON.stringify(error.response?.data)}`,
      );
      throw error;
    }
  }
}
