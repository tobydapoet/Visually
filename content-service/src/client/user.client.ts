import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserResponse } from './dto/UserResponse.dto';
import UserBatch from './dto/UserBatch.dto';

@Injectable()
export class UserClient {
  constructor(private readonly http: HttpService) {}
  async getBatchUsers(ids: string): Promise<UserResponse[]> {
    try {
      const res = await firstValueFrom(
        this.http.get(`${process.env.USER_SERVICE_URL}/account/batch`, {
          params: { ids },
        }),
      );
      return res.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException('User Service is unavailable');
      }
      if (error.code === 'ECONNABORTED') {
        throw new ServiceUnavailableException('User Service request timed out');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.message);
      }
      if (error.response?.status === 404) {
        throw new NotFoundException('Users not found');
      }
      throw new InternalServerErrorException('Failed to fetch batch users');
    }
  }

  async getValidateBatchUsers(
    userId: string,
    users: UserBatch[],
  ): Promise<UserResponse[]> {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${process.env.USER_SERVICE_URL}/account/validate`,
          {
            users,
          },
          {
            headers: {
              'x-user-id': userId.toString(),
            },
          },
        ),
      );
      return res.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException('User Service is unavailable');
      }
      if (error.code === 'ECONNABORTED') {
        throw new ServiceUnavailableException('User Service request timed out');
      }
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.message);
      }
      if (error.response?.status === 404) {
        throw new NotFoundException('Users not found');
      }
      throw new InternalServerErrorException('Failed to validate batch users');
    }
  }
}
