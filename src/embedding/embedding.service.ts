import {
  EmbeddingItem,
  Embeddings,
  OpenAIClient,
  OpenAIKeyCredential,
} from '@azure/openai';
import { BadRequestException, Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { error, log } from 'console';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import {
  EmbeddingResultDTO,
  FunctionData,
  Point,
  SearchResultDTO,
} from './dto/embedding.dto';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly openAIClient: OpenAIClient,
    private readonly qdrantClient: QdrantClient,
  ) {}

  async save(
    data: FunctionData[],
    collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    const collectionExist = await this.isCollection(collectionName);
    if (!collectionExist) {
      this.createCollection(collectionName);
    }
    const functionbody: string[] = [];
    data.forEach((element) => {
      functionbody.push(element.body);
    });
    const embeddings = await this.createEmbeddings(functionbody);
    return await this.saveEmbeddings(embeddings, data, collectionName);
  }

  async isCollection(collectionName: string): Promise<boolean> {
    const collections = (await this.qdrantClient.getCollections()).collections;
    let collectionExist: boolean = false;
    collections.forEach((collection) => {
      if (collection.name == collectionName) {
        collectionExist = true;
      }
    });
    return collectionExist;
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
