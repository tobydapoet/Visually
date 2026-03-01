import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { ShortModule } from './short/short.module';
import { StoryModule } from './story/story.module';
import { TagModule } from './tag/tag.module';
import { CollabModule } from './collab/collab.module';
import { PostMediaModule } from './post_media/post_media.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ContextModule } from './context/context.module';
import { ClientModule } from './client/client.module';
import { StoryStorageModule } from './story_storage/story_storage.module';
import { KafkaModule } from './kafka/kafka.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    PostModule,
    ShortModule,
    StoryModule,
    TagModule,
    CollabModule,
    PostMediaModule,
    ContextModule,
    ClientModule,
    StoryStorageModule,
    KafkaModule,
  ],
  providers: [AppService],
})
export class AppModule {}
