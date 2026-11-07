import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { normalizeAddress, Person, Via, VIAS, Visit, VisitedAddress, VisitPage } from '@smallweb/shared';
import { VisitDoc } from './db';
import { Store } from './store';

export interface VisitInput {
  address?: unknown;
  revisionId?: unknown;
  via?: unknown;
  from?: unknown;
}

function toVisit(v: VisitDoc): Visit {
  return {
    id: v._id.toHexString(),
    personId: v.personId,
    address: v.address,
    revisionId: v.revisionId,
    title: v.title,
    via: v.via,
    from: v.from,
    at: v.at.toISOString(),
  };
}

// Visits are listed newest first. The cursor is the (at, _id) of the last
// visit on the previous page, so pages never overlap or skip, even while new
// visits are being recorded at the top.
function encodeCursor(v: VisitDoc): string {
  return Buffer.from(`${v.at.toISOString()}|${v._id.toHexString()}`).toString('base64url');
}

function decodeCursor(cursor: string): { at: Date; id: ObjectId } {
  const [at, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const date = new Date(at);
  if (Number.isNaN(date.getTime()) || !id || !ObjectId.isValid(id)) throw new BadRequestException('bad cursor');
  return { at: date, id: new ObjectId(id) };
}

@Injectable()
export class PeopleService {
  constructor(private readonly store: Store) {}

  async list(): Promise<Person[]> {
    const people = await this.store.db.people.find().sort({ name: 1 }).toArray();
    return people.map((p) => ({ id: p._id, name: p.name, blurb: p.blurb }));
  }

  private async mustExist(personId: string) {
    const p = await this.store.db.people.findOne({ _id: personId });
    if (!p) throw new NotFoundException(`nobody called ${personId}`);
  }

  /**
   * Record that someone arrived somewhere. The server decides the time and
   * what the address resolved to; the client only says where and how.
   */
  async record(personId: string, input: VisitInput): Promise<Visit> {
    await this.mustExist(personId);
    const address = typeof input.address === 'string' ? normalizeAddress(input.address) : null;
    if (!address) throw new BadRequestException('visits are to addresses');
    const via = input.via as Via;
    if (!VIAS.includes(via)) throw new BadRequestException(`via must be one of ${VIAS.join(', ')}`);
    const from = typeof input.from === 'string' ? normalizeAddress(input.from) : null;

    // Back, forward and history jumps show the revision the person had
    // before, which may not be the current one. Anything else is current.
    let revisionId: string | null = null;
    let title: string | null = null;
    if (typeof input.revisionId === 'string') {
      const rev = await this.store.db.revisions.findOne({ _id: input.revisionId, address });
      if (!rev) throw new BadRequestException('that revision is not of that address');
      revisionId = rev._id;
      title = rev.title;
    }

    const doc: VisitDoc = { _id: new ObjectId(), personId, address, revisionId, title, via, from, at: new Date() };
    await this.store.db.visits.insertOne(doc);
    return toVisit(doc);
  }

  async history(personId: string, before?: string, limit = 50): Promise<VisitPage> {
    await this.mustExist(personId);
    const filter: Record<string, unknown> = { personId };
    if (before) {
      const c = decodeCursor(before);
      filter.$or = [{ at: { $lt: c.at } }, { at: c.at, _id: { $lt: c.id } }];
    }
    const docs = await this.store.db.visits
      .find(filter)
      .sort({ at: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();
    const items = docs.slice(0, limit);
    return {
      items: items.map(toVisit),
      next: docs.length > limit ? encodeCursor(items[items.length - 1]) : null,
    };
  }

  /** Every address this person has been shown a page at, how often, and when last. */
  async visited(personId: string): Promise<VisitedAddress[]> {
    await this.mustExist(personId);
    const rows = await this.store.db.visits
      .aggregate<{ _id: string; count: number; last: Date }>([
        { $match: { personId, revisionId: { $ne: null } } },
        { $group: { _id: '$address', count: { $sum: 1 }, last: { $max: '$at' } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    return rows.map((r) => ({ address: r._id, count: r.count, last: r.last.toISOString() }));
  }
}

@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  list() {
    return this.people.list();
  }

  @Get(':id/visits')
  history(@Param('id') id: string, @Query('before') before?: string, @Query('limit') limit?: string) {
    const n = Math.min(Math.max(parseInt(limit ?? '50', 10) || 50, 1), 200);
    return this.people.history(id, before || undefined, n);
  }

  @Post(':id/visits')
  record(@Param('id') id: string, @Body() body: VisitInput) {
    return this.people.record(id, body ?? {});
  }

  @Get(':id/visited')
  visited(@Param('id') id: string) {
    return this.people.visited(id);
  }
}
