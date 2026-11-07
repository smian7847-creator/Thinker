import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { normalizeAddress, Published, Revision, SiteSummary } from '@thinker/shared';
import { DatabaseService } from '../database/database.service';
import type { RevisionDoc } from '../database/schema';
import { PeopleService } from '../people/people.service';
import { editKeyMatches, hashEditKey, newEditKey } from './edit-keys';
import { PublishInput } from './publish.input';
import { extractText, sanitize } from './sanitize';

const DUPLICATE_KEY = 11000;

function toRevision(r: RevisionDoc, authorName: string): Revision {
  return {
    id: r._id,
    address: r.address,
    n: r.n,
    title: r.title,
    html: r.html,
    authorId: r.authorId,
    authorName,
    createdAt: r.createdAt.toISOString(),
  };
}

@Injectable()
export class SitesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly people: PeopleService,
  ) {}

  async list(): Promise<SiteSummary[]> {
    const [sites, names] = await Promise.all([
      this.database.db.sites.find().sort({ _id: 1 }).toArray(),
      this.people.names(),
    ]);
    return sites.map((s) => ({
      address: s._id,
      title: s.title,
      authorId: s.authorId,
      authorName: names.get(s.authorId) ?? s.authorId,
      revision: s.revisionCount,
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  /** The current revision living at an address, or null if nothing does. */
  async resolve(raw: string): Promise<Revision | null> {
    const address = normalizeAddress(raw);
    if (!address) throw new BadRequestException(`"${raw}" is not an address`);
    const site = await this.database.db.sites.findOne({ _id: address });
    return site ? this.revision(site.currentRevisionId) : null;
  }

  async revision(id: string): Promise<Revision | null> {
    const r = await this.database.db.revisions.findOne({ _id: id });
    return r ? toRevision(r, await this.people.nameOf(r.authorId)) : null;
  }

  /** What the author wrote, before sanitizing. */
  async source(id: string): Promise<string | null> {
    const r = await this.database.db.revisions.findOne({ _id: id }, { projection: { source: 1 } });
    return r ? r.source : null;
  }

  /**
   * Publish a page. A free address is claimed by whoever publishes there
   * first, and they get back the site's edit key. After that a new revision
   * needs both the same author and that key: the name alone is only a claim.
   * Old revisions stay, so anyone who still has one open in their back
   * history gets the page they left.
   */
  async publish(input: PublishInput): Promise<Published> {
    const author = await this.people.find(input.authorId);
    if (!author) throw new BadRequestException('Pick who is publishing');

    const html = sanitize(input.source);
    const text = extractText(html);
    const now = new Date();

    const claimed = await this.tryClaim(input, text, now);
    const n = claimed ? 1 : await this.nextRevision(input, text, now);

    const rev: RevisionDoc = {
      _id: `${input.address}@${n}`,
      address: input.address,
      n,
      title: input.title,
      source: input.source,
      html,
      text,
      authorId: input.authorId,
      createdAt: now,
    };
    await this.database.db.revisions.insertOne(rev);
    if (n > 1) {
      // Point at the new revision only once it exists, and only if no later edit has landed meanwhile.
      await this.database.db.sites.updateOne(
        { _id: input.address, revisionCount: n },
        { $set: { currentRevisionId: rev._id } },
      );
    }

    const published: Published = toRevision(rev, author.name);
    // Shown once, to whoever claimed the address. The server only keeps its hash.
    if (claimed) published.editKey = claimed.editKey;
    return published;
  }

  /** Claim a free address. Returns its new edit key, or null if it was taken. */
  private async tryClaim(input: PublishInput, text: string, now: Date): Promise<{ editKey: string } | null> {
    const editKey = newEditKey();
    try {
      await this.database.db.sites.insertOne({
        _id: input.address,
        authorId: input.authorId,
        title: input.title,
        text,
        currentRevisionId: `${input.address}@1`,
        revisionCount: 1,
        editKeyHash: hashEditKey(editKey),
        createdAt: now,
        updatedAt: now,
      });
      return { editKey };
    } catch (e) {
      if ((e as { code?: number }).code === DUPLICATE_KEY) return null;
      throw e;
    }
  }

  /** Reserve the next revision number of a taken address, if the request may. */
  private async nextRevision(input: PublishInput, text: string, now: Date): Promise<number> {
    const { sites } = this.database.db;
    const owner = await sites.findOne({ _id: input.address });
    if (!owner || owner.authorId !== input.authorId) {
      const ownerName = owner ? await this.people.nameOf(owner.authorId) : 'someone else';
      throw new ConflictException(`${input.address} already belongs to ${ownerName}`);
    }
    if (!editKeyMatches(input.editKey, owner.editKeyHash)) {
      throw new ForbiddenException(`Publishing a new revision of ${input.address} needs its edit key`);
    }
    // $inc hands out n atomically; matching the hash again closes the gap since the check.
    const updated = await sites.findOneAndUpdate(
      { _id: input.address, authorId: input.authorId, editKeyHash: owner.editKeyHash },
      { $inc: { revisionCount: 1 }, $set: { title: input.title, text, updatedAt: now } },
      { returnDocument: 'after' },
    );
    if (!updated) throw new ConflictException(`${input.address} changed hands while you were publishing`);
    return updated.revisionCount;
  }
}
