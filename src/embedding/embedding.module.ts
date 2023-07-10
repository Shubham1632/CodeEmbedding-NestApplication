import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { OpenAIClient, OpenAIKeyCredential } from '@azure/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';
import { CacheService } from '../cache/cache-service/cache.service';
import { Database } from 'arangojs';

@Module({
  controllers: [EmbeddingController],
  providers: [
    EmbeddingService,
    CacheService,
    {
      provide: OpenAIClient,
      useFactory: () => {
        dotenv.config();
        const openai_api_key = process.env.OPENAI_API_KEY;
        return new OpenAIClient(new OpenAIKeyCredential(openai_api_key));
      },
    },
    {
      provide: QdrantClient,
      useFactory: () => {
        return new QdrantClient({
          url: 'http://127.0.0.1:6333',
        });
      },
    },
    {
      provide: 'ARANGODB_CONNECTION',
      useFactory: () => {
        return new Database({
          url: 'http://localhost:8529',
          auth: { username: 'root', password: 'test123' },
        });
      },
    },
  ],
})
export class EmbeddingModule {}
