import { Injectable } from '@nestjs/common';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { EntityManager, Repository } from 'typeorm';
import { ContentClient } from '../client/content.client';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    private contentClient: ContentClient,
  ) {}
  async create(
    createAttachmentDto: CreateAttachmentDto,
    manager: EntityManager,
  ) {
    const content = await this.contentClient.getContent(
      createAttachmentDto.targetId,
      createAttachmentDto.targetType,
    );
    const newAttachment = this.attachmentRepo.create({
      snapshotAvatarUrl: content.avatarUrl,
      snapshotCaption: content.caption,
      snapshotMediaUrl: content.mediaUrl,
      snapshotUsername: content.username,
      ...createAttachmentDto,
    });
    return manager.save(Attachment, newAttachment);
  }
}
