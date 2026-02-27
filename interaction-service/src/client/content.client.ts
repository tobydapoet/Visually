import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserDto } from './dto/user-response.dto';

@Injectable()
export class ContentClient {
  constructor(private readonly http: HttpService) {}

  async getPostOwner(postId: number): Promise<UserDto> {
    const url = `http://CONTENT-SERVICE/posts/${postId}`;
    const res = await firstValueFrom(this.http.get<UserDto>(url));
    return res.data;
  }

  async getShortOwner(shortId: number): Promise<UserDto> {
    const url = `http://CONTENT-SERVICE/shorts/${shortId}`;
    const res = await firstValueFrom(this.http.get<UserDto>(url));
    return res.data;
  }

  async getStoryOwner(storyId: number): Promise<UserDto> {
    const url = `http://CONTENT-SERVICE/stories/${storyId}`;
    const res = await firstValueFrom(this.http.get<UserDto>(url));
    return res.data;
  }
}
