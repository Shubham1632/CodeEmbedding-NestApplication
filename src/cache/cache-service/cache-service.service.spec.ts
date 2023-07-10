import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import {Database} from "arangojs";
import {DocumentCollection} from "arangojs/collection";

describe('CacheServiceService', () => {
  let service: CacheService;
  let collection: DocumentCollection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService,
        {
          provide: 'ARANGODB_CONNECTION',
          useFactory:  () => {
            return {
              collection: jest.fn().mockReturnValue(
                  {
                    save: jest.fn()
                  }
              )
            }
          }
        },
        {
          provide: 'ARANGODB_QUERY',
          useFactory:  () => {
            return {
              collection: jest.fn().mockReturnValue(
                  {
                    save: jest.fn()
                  }
              )
            }
          }
        }],
    }).compile();

    service = module.get<CacheService>(CacheService);
    collection = module.get<Database>('ARANGODB_CONNECTION').collection("cache");
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call save method from arango collection when saving cache', () => {
    service.save('test', [1,2,3]);
    expect(collection.save).toBeCalledTimes(1);
    expect(collection.save).toBeCalledWith({
      _key: '90a3ed9e32b2aaf4c61c410eb925426119e1a9dc53d4286ade99a809',
      code: 'test',
      embedding: [1,2,3]
    });
  });
});
