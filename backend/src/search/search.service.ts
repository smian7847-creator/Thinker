import { Injectable } from '@nestjs/common';
import { queryTerms, SearchResult } from '@thinker/shared';
import { DatabaseService } from '../database/database.service';
import { PeopleService } from '../people/people.service';
import { snippet } from './snippet';

export const MAX_QUERY_LENGTH = 200;

/**
 * Search runs in Mongo, over a text index on every site's current title and
 * body (title weighted 5x). Mongo stems and drops stopwords; we rank by its
 * relevance score and cut a snippet from the body around the first match.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly database: DatabaseService,
    private readonly people: PeopleService,
  ) {}

  async search(q: string, limit = 20): Promise<SearchResult> {
    const terms = queryTerms(q);
    if (!q.trim()) return { q, terms, hits: [] };

    const [docs, names] = await Promise.all([
      this.database.db.sites
        .find<{ _id: string; title: string; text: string; authorId: string; score: number }>(
          { $text: { $search: q } },
          { projection: { score: { $meta: 'textScore' }, title: 1, text: 1, authorId: 1 } },
        )
        .sort({ score: { $meta: 'textScore' }, _id: 1 })
        .limit(limit)
        .toArray(),
      this.people.names(),
    ]);

    return {
      q,
      terms,
      hits: docs.map((d) => ({
        address: d._id,
        title: d.title,
        authorName: names.get(d.authorId) ?? d.authorId,
        snippet: snippet(d.text, terms),
        score: Math.round(d.score * 100) / 100,
      })),
    };
  }
}
