import exp from 'constants';
import { EmbeddingController } from './../embedding.controller';
import { EmbeddingItem, Embeddings, OpenAIKeyCredential } from '@azure/openai';

export class EmbeddingDTO {
  embedding: EmbeddingItem;
  payload: string;
}

export class FunctionData {
  name: string;
  body: string;
}

export class EmbeddingResultDTO {
  operation_id: number;
  status: 'acknowledged' | 'completed';
}

export class Point {
  id: string;
  vector: number[];
  payload: { code: string };
}
