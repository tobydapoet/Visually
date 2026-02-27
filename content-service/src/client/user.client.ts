import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserResponse } from './dto/UserResponse.dto';
const FormData = require('form-data');

@Injectable()
export class UserClient {
  constructor(private readonly http: HttpService) {}
  async getBatchUsers(ids: string): Promise<UserResponse[]> {
    const res = await firstValueFrom(
      this.http.get(`${process.env.USER_SERVICE_URL}/account/batch/${ids}`, {}),
    );
    return res.data;
  }
}
