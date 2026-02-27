import { Post } from 'src/post/entities/post.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('post_medias')
export class PostMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  mediaId!: number;

  @Column({ type: 'text', nullable: false })
  mediaUrl!: string;

  @ManyToOne(() => Post, (post) => post.medias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: Post;
}
