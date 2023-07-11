import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { OpenAIClient } from '@azure/openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  EmbeddingResultDTO,
  FunctionData,
  SearchResultDTO,
} from './dto/embedding.dto';
import { CacheService } from '../cache/cache-service/cache.service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let qdrant: QdrantClient;
  let openai: OpenAIClient;
  let cacheService: CacheService;
  const collectionName = 'code';

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
              search: jest.fn(),
              getCollections: jest.fn(),
            };
          },
        },
        {
          provide: CacheService,
          useFactory: () => {
            return {
              get: jest.fn(null).mockReturnValue(null),
              save: jest.fn(),
            };
          },
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    qdrant = module.get<QdrantClient>(QdrantClient);
    openai = module.get<OpenAIClient>(OpenAIClient);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save the embeddigs in the qdrant database', async () => {
    const data: FunctionData[] = [
      {
        name: 'GlowAdvancement.addCriterion',
        body: 'public void addCriterion(String criterion) {\n        if (!criteriaIds.contains(criterion)) {\n            criteriaIds.add(criterion);\n        }\n    }',
        link: 'dummy link',
      },
      {
        name: 'GlowAdvancement.addRequirement',
        body: 'public void addRequirement(List<String> criteria) {\n        requirements.add(criteria);\n    }',
        link: 'dummy link',
      },

      {
        name: 'GlowAdvancement.getCriteria',
        body: '@Override\n    public List<String> getCriteria() {\n        return ImmutableList.copyOf(criteriaIds);\n    }',
        link: 'dummy link',
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
    jest
      .spyOn(qdrant, 'getCollections')
      .mockResolvedValue({ collections: [{ name: collectionName }] });

    const responce = await service.save(data, collectionName);
    expect(responce.status).toBe('completed');
    expect(responce.operation_id).toBe(2);
  });

  it('should return a search result for the given query from qdrant database', async () => {
    const query = 'function to add a criteria';

    const mockedEmbeddingsResponse = {
      data: [
        {
          embedding: [-0.0015572973, 0.0069505316, -0.0048345947, 0.0019796833],
          index: 0,
        },
      ],
      usage: { promptTokens: 45, totalTokens: 45 },
    };

    const mockedSearchResponse = [
      {
        id: '43b83ae1-dbf8-4d42-93a0-7d0d127c9043',
        version: 0,
        score: 0.8379978,
        payload: {
          code: 'public void addRequirement(List<String> criteria) {\n        requirements.add(criteria);\n    }',
        },
        vector: null,
      },
      {
        id: 'b8c9354a-e0b4-478f-8223-0b69cb0a0752',
        version: 0,
        score: 0.7953689,
        payload: {
          code: 'public void addCriterion(String criterion) {\n        if (!criteriaIds.contains(criterion)) {\n            criteriaIds.add(criterion);\n        }\n    }',
          name: 'addCriterion',
          link: 'dummyLink',
        },
        vector: null,
      },
    ];

    jest.spyOn(qdrant, 'search').mockResolvedValue(mockedSearchResponse);
    jest
      .spyOn(openai, 'getEmbeddings')
      .mockResolvedValue(mockedEmbeddingsResponse);
    jest
      .spyOn(qdrant, 'getCollections')
      .mockResolvedValue({ collections: [{ name: collectionName }] });

    const response: SearchResultDTO[] = await service.search(
      query,
      collectionName,
    );
    expect(response[0].id).toBe('43b83ae1-dbf8-4d42-93a0-7d0d127c9043');
    expect(response[0].version).toBe(0);
  });

  it('should cache the embeddings when saved', async () => {
    const functionData: FunctionData[] = [
      {
        name: 'GlowAdvancement.addCriterion',
        body: 'public void addCriterion(String criterion) {\n        if (!criteriaIds.contains(criterion)) {\n            criteriaIds.add(criterion);\n        }\n    }',
        link: 'dummy link',
      },
      {
        name: 'GlowAdvancement.addRequirement',
        body: 'public void addRequirement(List<String> criteria) {\n        requirements.add(criteria);\n    }',
        link: 'dummy link',
      },
    ];

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
      .spyOn(qdrant, 'getCollections')
      .mockResolvedValue({ collections: [{ name: collectionName }] });
    jest.spyOn(cacheService, 'save').mockResolvedValue();
    jest
      .spyOn(openai, 'getEmbeddings')
      .mockResolvedValue(mockedEmbeddingsResponse);

    await service.save(functionData, collectionName);
    expect(cacheService.save).toBeCalledTimes(2);
  });

  it('should return the cached embeddings when searched', async () => {
    const functionData: FunctionData[] = [
      {
        name: 'GlowAdvancement.addCriterion',
        body: 'public void addCriterion(String criterion) {\n        if (!criteriaIds.contains(criterion)) {\n            criteriaIds.add(criterion);\n        }\n    }',
        link: 'dummy link',
      },
      {
        name: 'GlowAdvancement.addRequirement',
        body: 'public void addRequirement(List<String> criteria) {\n        requirements.add(criteria);\n    }',
        link: 'dummy link',
      },
    ];

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
      .spyOn(qdrant, 'getCollections')
      .mockResolvedValue({ collections: [{ name: collectionName }] });
    jest.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    jest.spyOn(cacheService, 'get').mockResolvedValueOnce({
      data: [
        {
          embedding: [-0.0015572973, 0.0069505316, -0.0048345947, 0.0019796833],
          index: 0,
        },
      ],
      usage: { promptTokens: 45, totalTokens: 45 },
    });
    jest
      .spyOn(openai, 'getEmbeddings')
      .mockResolvedValue(mockedEmbeddingsResponse);

    await service.save(functionData, collectionName);

    expect(openai.getEmbeddings).toBeCalledTimes(1);
  });
});
