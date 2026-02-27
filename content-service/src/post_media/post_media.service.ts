import { Injectable } from '@nestjs/common';
import { PostMedia } from './entities/post_media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MediaResponse } from 'src/client/dto/MediaResponse.dto';

@Injectable()
export class PostMediaService {
  @InjectRepository(PostMedia) private postMediaRepo: Repository<PostMedia>;
  async createMany(
    mediaRes: MediaResponse[],
    postId: number,
    transactionManager?: EntityManager,
  ): Promise<PostMedia[]> {
    const manager = transactionManager || this.postMediaRepo.manager;

    const postMedias = mediaRes.map((media) =>
      this.postMediaRepo.create({
        post: { id: postId },
        mediaId: media.id,
        mediaUrl: media.url,
      }),
    );

    return manager.save(PostMedia, postMedias);
  }

  findByPost(postId: number): Promise<PostMedia[]> {
    const medias = this.postMediaRepo.find({ where: { post: { id: postId } } });
    return medias;
  }

  async deleteByPost(postId: number) {
    return this.postMediaRepo.delete({ post: { id: postId } });
  }
}
