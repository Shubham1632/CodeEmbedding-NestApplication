import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmbeddingModule } from './embedding/embedding.module';

@Module({
  imports: [EmbeddingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
