import { Module } from '@nestjs/common';
import { CacheService } from './cache-service/cache.service';
import { Database } from 'arangojs';

@Module({
  providers: [
    CacheService,
    {
      provide: 'ARANGODB_CONNECTION',
      useFactory: () => {
        return new Database({
          url: 'http://localhost:8529',
          auth: { username: 'root', password: 'test123' },
        });
      },
    },
  ],
})
export class CacheModule {}
