import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { Database } from 'arangojs';
import { DocumentCollection } from 'arangojs/collection';

describe('CacheServiceService', () => {
  let service: CacheService;
  let collection: DocumentCollection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: 'ARANGODB_CONNECTION',
          useFactory: () => {
            return {
              collection: jest.fn().mockReturnValue({
                save: jest.fn(),
                documents: jest.fn().mockResolvedValue([]),
                exists: jest.fn().mockResolvedValue(true),
                documentExists: jest.fn().mockResolvedValue(false),
              }),
              listDatabases: jest.fn().mockResolvedValue(['code-embedding']),
            };
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    collection = module
      .get<Database>('ARANGODB_CONNECTION')
      .collection('cache');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call save method from arango collection when saving cache', async () => {
    await service.save('test', {
      data: [{ embedding: [1, 2, 3], index: 0 }],
      usage: { promptTokens: 0, totalTokens: 0 },
    });
    expect(collection.save).toBeCalledTimes(1);
    expect(collection.save).toBeCalledWith({
      _key: '90a3ed9e32b2aaf4c61c410eb925426119e1a9dc53d4286ade99a809',
      code: 'test',
      embedding: {
        data: [
          {
            embedding: [1, 2, 3],
            index: 0,
          },
        ],
        usage: {
          promptTokens: 0,
          totalTokens: 0,
        },
      },
    });
  });

  it('should call get method from arango collection when getting cache', async () => {
    jest.spyOn(collection, 'documentExists').mockResolvedValue(true);
    jest.spyOn(collection, 'documents').mockResolvedValue([
      {
        _key: '90a3ed9e32b2aaf4c61c410eb925426119e1a9dc53d4286ade99a809',
        code: 'test',
        embedding: {
          data: [{ embedding: [1, 2, 3], index: 0 }],
          usage: { promptTokens: 0, totalTokens: 0 },
        },
      },
    ]);
    await service.get('test');
    expect(collection.documents).toBeCalledTimes(1);
    expect(collection.documents).toBeCalledWith([
      '90a3ed9e32b2aaf4c61c410eb925426119e1a9dc53d4286ade99a809',
    ]);
  });

  it("should return null if key doesn't exit", async () => {
    jest.spyOn(collection, 'documents').mockResolvedValue([]);
    const result = await service.get('test');
    expect(result).toBeNull();
  });
});
