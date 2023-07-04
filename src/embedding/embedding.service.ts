import { QdrantClient } from '@qdrant/js-client-rest';
import {
  EmbeddingItem,
  Embeddings,
  OpenAIClient,
  OpenAIKeyCredential,
} from '@azure/openai';
import { Injectable } from '@nestjs/common';
import { EmbeddingResultDTO, FunctionData, Point } from './dto/embedding.dto';
import { randomUUID } from 'crypto';
import { log } from 'console';
import { copyFileSync } from 'fs';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly openAIClient: OpenAIClient,
    private readonly qdrantClient: QdrantClient,
  ) {
    this.openAIClient = new OpenAIClient(
      new OpenAIKeyCredential(
        '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',
      ),
    );
    this.qdrantClient = new QdrantClient({
      url: 'http://127.0.0.1:6333',
    });
  }

  async save(
    data: FunctionData[],
    collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    const collections = (await this.qdrantClient.getCollections()).collections;
    let collectionExist: boolean = false;
    collections.forEach((collection) => {
      if (collection.name == collectionName) {
        collectionExist = true;
      }
    });
    if (!collectionExist) {
      log('collection does not exist');
      this.createCollection(collectionName);
    }
    const functionbody: string[] = [];
    data.forEach((element) => {
      functionbody.push(element.body);
    });
    const embeddings = await this.createEmbeddings(functionbody);
    return await this.saveEmbeddings(embeddings, data, collectionName);
  }

  async createEmbeddings(data: string[]): Promise<Embeddings> {
    return await this.openAIClient.getEmbeddings(
      'text-embedding-ada-002',
      data,
    );
  }
  async saveEmbeddings(
    embeddings: Embeddings,
    functionData: FunctionData[],
    collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    const points: Point[] = [];
    embeddings.data.forEach((embedding: EmbeddingItem, index: number) => {
      const point = this.createPoint(embedding, index, functionData);
      points.push(point);
    });

    return await this.qdrantClient.upsert(collectionName, { points });
  }
  createPoint(
    embedding: EmbeddingItem,
    index: number,
    functionData: FunctionData[],
  ): Point {
    return {
      id: randomUUID().toString(),
      vector: embedding.embedding,
      payload: { code: functionData[index].body },
    };
  }

  async createCollection(collectionName) {
    try {
      await this.qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
