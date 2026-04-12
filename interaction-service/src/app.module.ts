import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { ShareModule } from './share/share.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextModule } from './context/context.module';
import { ClientModule } from './client/client.module';
import { ReportModule } from './report/report.module';
import { InteractionModule } from './interaction/interaction.module';
import { MentionModule } from './mention/mention.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
    LikeModule,
    CommentModule,
    ShareModule,
    ContextModule,
    ClientModule,
    ReportModule,
    InteractionModule,
    MentionModule,
  ],
  providers: [AppService],
})
export class AppModule {}
