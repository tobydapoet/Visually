import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FeedModule } from './feed/feed.module';
import { FeedRecommendModule } from './feed-recommend/feed-recommend.module';
import { ClientModule } from './client/client.module';
import { FollowEdgeModule } from './follow_edge/follow_edge.module';
import { ContentEdgeModule } from './content_edge/content_edge.module';
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
    FeedModule,
    FeedRecommendModule,
    ClientModule,
    FollowEdgeModule,
    ContentEdgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
