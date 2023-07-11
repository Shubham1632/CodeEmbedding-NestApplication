import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [EmbeddingModule, CacheModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
