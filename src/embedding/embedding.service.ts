import { EmbeddingItem, Embeddings, OpenAIClient } from '@azure/openai';
import { BadRequestException, Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';
import {
  EmbeddingResultDTO,
  FunctionData,
  Point,
  SearchResultDTO,
} from './dto/embedding.dto';
import { CacheService } from '../cache/cache-service/cache.service';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly openAIClient: OpenAIClient,
    private readonly qdrantClient: QdrantClient,
    private readonly cacheService: CacheService,
  ) {}

  async save(
    data: FunctionData[],
    collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    const collectionExist = await this.isCollection(collectionName);
    if (!collectionExist) {
      await this.createCollection(collectionName);
    }
    const functionBody: string[] = [];
    data.forEach((element) => {
      functionBody.push(element.body);
    });
    const embeddings: Embeddings = await this.createEmbeddings(functionBody);
    const promises = embeddings.data.map(
      async (embedding: EmbeddingItem, index: number) => {
        await this.cacheService.save(data[index].body, {
          data: [embedding],
          usage: { promptTokens: 0, totalTokens: 0 },
        });
      },
    );
    await Promise.all(promises);
    return await this.saveEmbeddings(embeddings, data, collectionName);
  }

  private async isCollection(collectionName: string): Promise<boolean> {
    const collections = (await this.qdrantClient.getCollections()).collections;
    let collectionExist: boolean = false;
    collections.forEach((collection) => {
      if (collection.name == collectionName) {
        collectionExist = true;
      }
    });
    return collectionExist;
  }

  private async createEmbeddings(data: string[]): Promise<Embeddings> {
    const embeddings: Embeddings = {
      data: [],
      usage: {
        promptTokens: 0,
        totalTokens: 0,
      },
    };
    const promises = data.map(async (element) => {
      const cache = await this.cacheService.get(element);
      if (cache) {
        return cache;
      } else {
        return await this.openAIClient.getEmbeddings('text-embedding-ada-002', [
          element,
        ]);
      }
    });
    embeddings.data = (await Promise.all(promises)).map(
      (element) => element.data[0],
    );
    return embeddings;
  }
  private async saveEmbeddings(
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
        link: functionData[index].link,
      },
    };
  }

  async createCollection(collectionName: string) {
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

    const collectionExist = await this.isCollection(collectionName);
    if (!collectionExist) {
      throw new BadRequestException('Collection Name dosent exist');
    }

    return await this.qdrantClient.search(collectionName, {
      vector: queryEmbedding.data[0].embedding,
      limit: 5,
      with_payload: true,
      score_threshold: 0.5,
    });
  }
}
