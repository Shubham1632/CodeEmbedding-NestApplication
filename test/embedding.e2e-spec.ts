import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { FunctionData } from '../src/embedding/dto/embedding.dto';

describe('EmbeddingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (POST) - should save embeddings in qdrand db', async () => {
    const data: FunctionData[] = [
      {
        name: 'GlowAdvancement.addCriterion',
        body: 'public void addCriterion(String criterion) {\n        if (!criteriaIds.contains(criterion)) {\n            criteriaIds.add(criterion);\n        }\n    }',
      },
      {
        name: 'GlowAdvancement.addRequirement',
        body: 'public void addRequirement(List<String> criteria) {\n        requirements.add(criteria);\n    }',
      },
      {
        name: 'GlowAdvancement.getCriteria',
        body: '@Override\n    public List<String> getCriteria() {\n        return ImmutableList.copyOf(criteriaIds);\n    }',
      },
    ];
    const response = await request(app.getHttpServer())
      .post('/embedding')
      .send(data);
    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe('completed');
  });
});
