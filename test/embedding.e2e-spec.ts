import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { functionData } from './data/embedding.data';

describe('EmbeddingController (e2e2)', () => {
  let app: INestApplication;
  let qdrantClient: QdrantClient;
  let collectionName: string = 'e2e2';

  beforeAll(async () => {
    qdrantClient = new QdrantClient({
      url: 'http://127.0.0.1:6333',
    });
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    qdrantClient.deleteCollection(collectionName);
  });

  it('/(POST) - should save embeddings in qdrand db', async () => {
    const response = await request(app.getHttpServer())
      .post(`/embedding?collectionName=e2e2`)
      .send(functionData);
    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe('completed');
  });

  it('/(GET) - should return a search result for a particular query', async () => {
    const query = 'fucntion to add a criteria';
    const response = await request(app.getHttpServer())
      .get(`/embedding?collectionName=e2e2&query=${query}`)
      .send();
    expect(response.statusCode).toBe(200);
    expect(response.body[0].id).toBeDefined();
    expect(response.body[0].score).toBeDefined();
    expect(response.body[0].payload.code).toBeDefined();
  });
});
