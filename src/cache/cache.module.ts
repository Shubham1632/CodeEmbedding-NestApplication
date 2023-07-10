import {Module} from '@nestjs/common';
import {CacheService} from './cache-service/cache.service';
import {aql, Database} from "arangojs";

@Module({
  providers: [CacheService,
    {
      provide: 'ARANGODB_CONNECTION',
      useFactory:  () => {
        return new Database({
          url: 'http://localhost:8529',
          databaseName: 'embedding',
          auth: {username: "root", password: "test123"},
        });
      },
    },
    {
      provide: 'ARANGODB_QUERY',
      useValue: aql,
    },
  ]
})
export class CacheModule {}
