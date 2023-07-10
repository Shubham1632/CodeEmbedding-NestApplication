import {Inject, Injectable} from '@nestjs/common';
import {Database} from "arangojs";
import {DocumentCollection} from "arangojs/collection";
const shajs = require('sha.js');

type EmbeddingCache = {
    _key: string,
    code: string,
    embedding: number[]
}

@Injectable()
export class CacheService {
    private  collection: DocumentCollection<EmbeddingCache>;
    constructor(
        @Inject('ARANGODB_CONNECTION') private readonly db: Database,
    ) {
         this.collection = this.db.collection("cache");
    }
    async save(code: string, embedding: number[]){
        const hash = this.getSHA224(code);
        await this.collection.save({
            _key: hash,
            code: code,
            embedding: embedding
        });
    }

    getSHA224(input) {
        let hash = shajs('sha224').update(input).digest('hex');
        while (hash.length < 32) {
            hash = '0' + hash;
        }
        return hash;
    }

    async get(code: string): Promise<EmbeddingCache> {
        const hash = this.getSHA224(code);
        const documents = await this.collection.documents(hash);
        return documents?.length > 0 ? documents[0] : null;
    }
}
