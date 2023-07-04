import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { OpenAIClient } from '@azure/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingResultDTO, FunctionData } from './dto/embedding.dto';

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let qdrant: QdrantClient;
  let openai: OpenAIClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: OpenAIClient,
          useFactory: () => {
            return {
              getEmbeddings: jest.fn(),
            };
          },
        },
        {
          provide: QdrantClient,
          useFactory: () => {
            return {
              upsert: jest.fn(),
            };
          },
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    qdrant = module.get<QdrantClient>(QdrantClient);
    openai = module.get<OpenAIClient>(OpenAIClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save the embeddigs in the qdrant database', async () => {
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
    const mockedUpsertResponse: EmbeddingResultDTO = {
      operation_id: 2,
      status: 'completed',
    };
    const mockedEmbeddingsResponse = {
      data: [
        {
          embedding: [-0.0015572973, 0.0069505316, -0.0048345947, 0.0019796833],
          index: 0,
        },

        {
          embedding: [-0.0003264073, 0.029289693, 0.00003256058, -0.024108855],
          index: 1,
        },
      ],
      usage: { promptTokens: 45, totalTokens: 45 },
    };
    jest
      .spyOn(openai, 'getEmbeddings')
      .mockResolvedValue(mockedEmbeddingsResponse);
    jest.spyOn(qdrant, 'upsert').mockResolvedValue(mockedUpsertResponse);
    const collectionName = 'code';
    const responce = await service.save(data, collectionName);
    expect(responce.status).toBe('completed');
  });
});
