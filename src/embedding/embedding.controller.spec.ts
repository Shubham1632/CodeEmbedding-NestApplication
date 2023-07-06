import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingController } from './embedding.controller';
import { FunctionData } from './dto/embedding.dto';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingController', () => {
  let controller: EmbeddingController;
  let service: EmbeddingService;
  const collectionName = 'code';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmbeddingController],
      providers: [
        {
          provide: EmbeddingService,

          useFactory: () => {
            return {
              save: jest.fn(),
              search: jest.fn(),
            };
          },
        },
      ],
    }).compile();

    controller = module.get<EmbeddingController>(EmbeddingController);
    service = module.get<EmbeddingService>(EmbeddingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call embedding service to save embeddings', async () => {
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

    const response = controller.save(data, collectionName);
    expect(service.save).toBeCalledTimes(1);
    expect(service.save).toBeCalledWith(data, collectionName);
  });

  it('should call the search function from searching the given query', async () => {
    const query = 'function to add a criteria';
    const response = controller.search(query, collectionName);
    expect(service.search).toBeCalledTimes(1);
    expect(service.search).toBeCalledWith(query, collectionName);
  });
});
