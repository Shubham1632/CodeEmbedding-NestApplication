import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { EmbeddingService } from './embedding.service';
import {
  EmbeddingResultDTO,
  FunctionData,
  SearchResultDTO,
} from './dto/embedding.dto';

@Controller('embedding')
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Get()
  async search(
    @Query('query') query: string,
    @Query('collectionName') collectionName: string,
  ): Promise<SearchResultDTO[]> {
    return await this.embeddingService.search(query, collectionName);
  }

  @Post()
  async save(
    @Body() data: FunctionData[],
    @Query('collectionName') collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    return this.embeddingService.save(data, collectionName);
  }
}
