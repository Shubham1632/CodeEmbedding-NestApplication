import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { OpenAIClient } from '@azure/openai';
import { QdrantClient } from '@qdrant/js-client-rest';

@Module({
  controllers: [EmbeddingController],
  providers: [EmbeddingService, OpenAIClient, QdrantClient],
})
export class EmbeddingModule {}
