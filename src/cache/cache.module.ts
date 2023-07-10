import { Module } from '@nestjs/common';
import { CacheService } from './cache-service/cache.service';
import { Database } from 'arangojs';

@Module({
  providers: [
    CacheService,
    {
      provide: 'ARANGODB_CONNECTION',
      useFactory: async () => {
        const sysDb = new Database({
          url: 'http://localhost:8529',
          auth: { username: 'root', password: 'test123' },
        });
        const databaseList = await sysDb.listDatabases();
        if (!databaseList.includes('code-embedding')) {
          await sysDb.createDatabase('code-embedding');
        }
        return sysDb.database('code-embedding');
      },
    },
  ],
})
export class CacheModule {}
