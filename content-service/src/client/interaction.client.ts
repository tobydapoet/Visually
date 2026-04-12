import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ContentServiceType } from 'src/enums/content.type';
import { InteractionResponse } from './dto/InteractionResponse.dto';

@Injectable()
export class InteractionClient {
  constructor(private readonly http: HttpService) {}
  async getCurrentInteraction(
    userId: string,
    targetIds: number[],
    targetType: ContentServiceType,
  ): Promise<InteractionResponse[]> {
    const targetIdsString = targetIds.join(',');
    const res = await firstValueFrom(
      this.http.get(
        `${process.env.INTERACTION_SERVICE_URL}/interaction?targetIds=${targetIdsString}&type=${targetType}`,
        {
          headers: {
            'x-user-id': userId,
          },
        },
      ),
    );
    return res.data;
  }
}
