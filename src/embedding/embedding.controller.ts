import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';

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
    if (!collectionName) {
      throw new BadRequestException('Please provide collectionName.');
    }
    if (!query) {
      throw new BadRequestException('Please provide valide query.');
    }

    return await this.embeddingService.search(query, collectionName);
  }

  @Post()
  async save(
    @Body() data: FunctionData[],
    @Query('collectionName') collectionName: string,
  ): Promise<EmbeddingResultDTO> {
    if (data.length == undefined || !data) {
      throw new BadRequestException('please provide data');
    }
    return this.embeddingService.save(data, collectionName);
  }
}
