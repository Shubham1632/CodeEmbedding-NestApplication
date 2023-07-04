import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { get } from 'http';
import { EmbeddingService } from './embedding.service';
import { EmbeddingResultDTO, FunctionData } from './dto/embedding.dto';

@Controller('embedding')
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Post('')
  async save(
    @Body() data: FunctionData[],
    @Query('collectionName') collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    return this.embeddingService.save(data, collectionName);
  }
}
