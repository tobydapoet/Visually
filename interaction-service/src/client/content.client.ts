import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserDto } from './dto/user-response.dto';

@Injectable()
export class ContentClient {
  constructor(private readonly http: HttpService) {}

  async getPostOwner(postId: number): Promise<UserDto> {
    const url = `${process.env.CONTENT_SERVICE_URL}/posts/${postId}`;
    const res = await firstValueFrom(this.http.get<UserDto>(url));
    return res.data;
  }

  async getShortOwner(shortId: number): Promise<UserDto> {
    const url = `${process.env.CONTENT_SERVICE_URL}/shorts/${shortId}`;
    const res = await firstValueFrom(this.http.get<UserDto>(url));
    return res.data;
  }

  async getStoryOwner(storyId: number): Promise<UserDto> {
    const url = `${process.env.CONTENT_SERVICE_URL}/stories/${storyId}`;
    const res = await firstValueFrom(this.http.get<UserDto>(url));
    return res.data;
  }
}
