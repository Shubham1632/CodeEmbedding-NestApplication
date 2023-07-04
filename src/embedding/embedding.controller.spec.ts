import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingController } from './embedding.controller';
import { FunctionData } from './dto/embedding.dto';
import { EmbeddingService } from './embedding.service';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

describe('EmbeddingController', () => {
  let controller: EmbeddingController;
  let service: EmbeddingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmbeddingController],
      providers: [
        {
          provide: EmbeddingService,

          useFactory: () => {
            return {
              save: jest.fn(),
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
    const collectionName = 'code';
    const response = controller.save(data, collectionName);
    expect(service.save).toBeCalledTimes(1);
    expect(service.save).toBeCalledWith(data, collectionName);
  });
});
