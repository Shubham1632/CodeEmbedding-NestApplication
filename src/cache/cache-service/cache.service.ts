import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'arangojs';
import { DocumentCollection } from 'arangojs/collection';
import { Embeddings } from '@azure/openai';
const shajs = require('sha.js');

type EmbeddingCache = {
  _key: string;
  code: string;
  embedding: Embeddings;
};

@Injectable()
export class CacheService {
  private collection: DocumentCollection<EmbeddingCache>;

  constructor(@Inject('ARANGODB_CONNECTION') private db: Database) {}

  async save(code: string, embedding: Embeddings): Promise<void> {
    await this.setupDb();
    const hash = this.getSHA224(code);
    if (await this.collection.documentExists(hash)) {
      await this.collection.update(hash, { embedding });
    } else {
      await this.collection.save({ _key: hash, code, embedding });
    }
  }

  private async setupDb() {
    if (!(await this.db.collection('cache').exists())) {
      await this.db.createCollection('cache');
    }
    this.collection = this.db.collection('cache');
  }

  private getSHA224(input: string): string {
    let hash = shajs('sha224').update(input).digest('hex');
    while (hash.length < 32) {
      hash = '0' + hash;
    }
    return hash;
  }

  async get(code: string): Promise<Embeddings> {
    await this.setupDb();
    const hash = this.getSHA224(code);
    if (await this.collection.documentExists(hash)) {
      return (await this.collection.documents([hash]))[0].embedding;
    }
    return null;
  }
}
