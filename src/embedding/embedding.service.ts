import { QdrantClient } from '@qdrant/js-client-rest';
import {
  EmbeddingItem,
  Embeddings,
  OpenAIClient,
  OpenAIKeyCredential,
} from '@azure/openai';
import { Injectable } from '@nestjs/common';
import {
  EmbeddingResultDTO,
  FunctionData,
  Point,
  SearchResultDTO,
} from './dto/embedding.dto';
import { randomUUID } from 'crypto';
import { log } from 'console';
import { copyFileSync } from 'fs';
import * as dotenv from 'dotenv';
import { escape } from 'querystring';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly openAIClient: OpenAIClient,
    private readonly qdrantClient: QdrantClient,
  ) {
    dotenv.config();
    const openai_api_key = process.env.OPENAI_API_KEY;
    this.openAIClient = new OpenAIClient(
      new OpenAIKeyCredential(openai_api_key),
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
      payload: {
        code: functionData[index].body,
        name: functionData[index].name,
      },
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

  async search(
    query: string,
    collectionName: string,
  ): Promise<SearchResultDTO[]> {
    const queryEmbedding = await this.createEmbeddings([query]);

    return await this.qdrantClient.search(collectionName, {
      vector: queryEmbedding.data[0].embedding,
      limit: 3,
      with_payload: true,
    });
  }
}
