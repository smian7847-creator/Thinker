import { Controller, Get, Query } from '@nestjs/common';
import { MAX_QUERY_LENGTH, SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') q: unknown) {
    return this.searchService.search(typeof q === 'string' ? q.slice(0, MAX_QUERY_LENGTH) : '');
  }
}
