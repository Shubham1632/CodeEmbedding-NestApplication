import { EmbeddingItem } from '@azure/openai';

export class EmbeddingDTO {
  embedding: EmbeddingItem;
  payload: string;
}

export class FunctionData {
  name: string;
  body: string;
  link: string;
}

export class EmbeddingResultDTO {
  operation_id: number;
  status: 'acknowledged' | 'completed';
}

export class Point {
  id: string;
  vector: number[];
  payload: { code: string; name: string; link: string };
}

export class SearchResultDTO {
  id: string | number;
  version: number;
  score: number;
  payload?:
    | Record<string, unknown>
    | {
        [key: string]: unknown;
      }
    | null
    | undefined;
  vector?:
    | Record<string, unknown>
    | number[]
    | {
        [key: string]: number[] | undefined;
      }
    | null
    | undefined;
}
