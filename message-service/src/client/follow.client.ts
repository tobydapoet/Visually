import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserDto } from './dto/response-user.dto';

@Injectable()
export class FollowClient {
  constructor(private readonly http: HttpService) {}

  async isBlocked(
    currentUserId: string,
    blockUserId: string,
  ): Promise<{ isBlocked: boolean }> {
    const res = await firstValueFrom(
      this.http.get(
        `${process.env.FOLLOW_SERVICE_URL}/block/user/check-block/${blockUserId}`,
        { headers: { 'x-user-id': currentUserId } },
      ),
    );
    return res.data;
  }
}
