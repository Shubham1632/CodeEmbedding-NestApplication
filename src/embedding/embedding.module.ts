import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { OpenAIClient, OpenAIKeyCredential } from '@azure/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';

@Module({
  controllers: [EmbeddingController],
  providers: [
    EmbeddingService,
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
  ],
})
export class EmbeddingModule {}
