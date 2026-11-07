import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { SearchResult } from '@smallweb/shared';
import { queryTerms, snippet } from './content';
import { Store } from './store';

/**
 * Search runs in Mongo, over a text index on every site's current title and
 * body (title weighted 5x). Mongo stems and drops stopwords; we rank by its
 * relevance score and cut a snippet from the body around the first match.
 */
@Injectable()
export class SearchService {
  constructor(private readonly store: Store) {}

  async search(q: string, limit = 20): Promise<SearchResult> {
    const terms = queryTerms(q);
    if (!q.trim()) return { q, terms, hits: [] };
    const [docs, people] = await Promise.all([
      this.store.db.sites
        .find({ $text: { $search: q } }, { projection: { score: { $meta: 'textScore' }, title: 1, text: 1, authorId: 1 } })
        .sort({ score: { $meta: 'textScore' }, _id: 1 })
        .limit(limit)
        .toArray(),
      this.store.db.people.find().toArray(),
    ]);
    const names = new Map(people.map((p) => [p._id, p.name]));
    return {
      q,
      terms,
      hits: docs.map((d) => ({
        address: d._id,
        title: d.title,
        authorName: names.get(d.authorId) ?? d.authorId,
        snippet: snippet(d.text, terms),
        score: Math.round(((d as unknown as { score: number }).score ?? 0) * 100) / 100,
      })),
    };
  }
}

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') q = '') {
    return this.searchService.search(String(q).slice(0, 200));
  }
}
