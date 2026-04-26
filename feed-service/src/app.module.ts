import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FeedModule } from './feed/feed.module';
import { ClientModule } from './client/client.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserInterestModule } from './user_interest/user_interest.module';
import { ContextModule } from './context/context.module';
import { FeedSeenModule } from './feed-seen/feed-seen.module';

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
    ClientModule,
    UserInterestModule,
    ContextModule,
    FeedSeenModule,
  ],
  providers: [AppService],
})
export class AppModule {}
