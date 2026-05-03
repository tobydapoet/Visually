import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserDto } from './dto/user-response.dto';
import UserBatch from './dto/UserBatch.dto';
import { UserResponse } from './dto/UserResponse.dto';

@Injectable()
export class UserClient {
  constructor(private readonly http: HttpService) {}

  async getUser(userId: string): Promise<UserDto> {
    const res = await firstValueFrom(
      this.http.get(
        `${process.env.USER_SERVICE_URL}/account/summary/${userId}`,
      ),
    );
    return res.data;
  }

  async getValidateBatchUsers(
    userId: string,
    users: UserBatch[],
  ): Promise<UserResponse[]> {
    try {
      const res = await firstValueFrom(
        this.http.post(
          `${process.env.USER_SERVICE_URL}/account/validate`,
          users,
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
      if (error.response?.status === 500) {
        throw new InternalServerErrorException(
          error.response.data?.message || 'User Service internal error',
        );
      }
      throw new InternalServerErrorException('Failed to validate batch users');
    }
  }
}
