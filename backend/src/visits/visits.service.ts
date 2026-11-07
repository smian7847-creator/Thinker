import { BadRequestException, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import type { Visit, VisitedAddress, VisitPage } from '@thinker/shared';
import { DatabaseService } from '../database/database.service';
import type { VisitDoc } from '../database/schema';
import { PeopleService } from '../people/people.service';
import { RecordVisitInput } from './record-visit.input';
import { encodeCursor, olderThan } from './visit-cursor';

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

/** Visits are what history is made of: who arrived where, when, and how. */
@Injectable()
export class VisitsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly people: PeopleService,
  ) {}

  /**
   * Record that someone arrived somewhere. The server sets the time and
   * checks what the client says it was shown.
   */
  async record(personId: string, input: RecordVisitInput): Promise<Visit> {
    await this.people.mustExist(personId);
    const { address, via, from } = input;

    let title: string | null = null;
    if (input.revisionId) {
      // Back and forward show the revision the person had before, which may
      // not be the current one, so any real revision of this address is fine.
      const rev = await this.database.db.revisions.findOne({ _id: input.revisionId, address });
      if (!rev) throw new BadRequestException('that revision is not of that address');
      title = rev.title;
    } else if (via !== 'back' && via !== 'forward' && (await this.siteExists(address))) {
      // Going back may return to a "nowhere" that has since been published,
      // but a fresh arrival at an address that exists did not lead nowhere.
      throw new BadRequestException(`${address} exists; a fresh visit to it can't have led nowhere`);
    }

    const doc: VisitDoc = {
      _id: new ObjectId(),
      personId,
      address,
      revisionId: input.revisionId,
      title,
      via,
      from,
      at: new Date(),
    };
    await this.database.db.visits.insertOne(doc);
    return toVisit(doc);
  }

  /** One page of a person's history, newest first. */
  async history(personId: string, before: string | undefined, limit: number): Promise<VisitPage> {
    await this.people.mustExist(personId);
    const filter = before ? { personId, ...olderThan(before) } : { personId };
    const docs = await this.database.db.visits
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
    await this.people.mustExist(personId);
    const rows = await this.database.db.visits
      .aggregate<{ _id: string; count: number; last: Date }>([
        { $match: { personId, revisionId: { $ne: null } } },
        { $group: { _id: '$address', count: { $sum: 1 }, last: { $max: '$at' } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    return rows.map((r) => ({ address: r._id, count: r.count, last: r.last.toISOString() }));
  }

  private async siteExists(address: string): Promise<boolean> {
    return (await this.database.db.sites.countDocuments({ _id: address }, { limit: 1 })) > 0;
  }
}
