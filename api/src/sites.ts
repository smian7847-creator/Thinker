import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { normalizeAddress, Revision, SiteSummary } from '@smallweb/shared';
import { RevisionDoc } from './db';
import { extractText, MAX_SOURCE_BYTES, sanitize } from './content';
import { Store } from './store';

export interface PublishInput {
  address?: unknown;
  title?: unknown;
  html?: unknown;
  authorId?: unknown;
}

@Injectable()
export class SitesService {
  constructor(private readonly store: Store) {}

  private async names(): Promise<Map<string, string>> {
    const people = await this.store.db.people.find().toArray();
    return new Map(people.map((p) => [p._id, p.name]));
  }

  private toRevision(r: RevisionDoc, authorName: string): Revision {
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

  async list(): Promise<SiteSummary[]> {
    const [sites, names] = await Promise.all([
      this.store.db.sites.find().sort({ _id: 1 }).toArray(),
      this.names(),
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
    const site = await this.store.db.sites.findOne({ _id: address });
    if (!site) return null;
    return this.revision(site.currentRevisionId);
  }

  async revision(id: string): Promise<Revision | null> {
    const r = await this.store.db.revisions.findOne({ _id: id });
    if (!r) return null;
    const author = await this.store.db.people.findOne({ _id: r.authorId });
    return this.toRevision(r, author?.name ?? r.authorId);
  }

  async source(id: string): Promise<string | null> {
    const r = await this.store.db.revisions.findOne({ _id: id }, { projection: { source: 1 } });
    return r ? r.source : null;
  }

  /**
   * Publish a page. A free address is claimed by whoever publishes there
   * first; after that only its author can publish to it again, and each time
   * they do a new revision is added. Old revisions stay, so anyone who still
   * has one open in their back history gets the page they left.
   */
  async publish(input: PublishInput): Promise<Revision> {
    const address = typeof input.address === 'string' ? normalizeAddress(input.address) : null;
    if (!address) throw new BadRequestException('An address looks like name.zz: letters, digits and hyphens, ending in .zz');
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title || title.length > 120) throw new BadRequestException('A title is required, up to 120 characters');
    const source = typeof input.html === 'string' ? input.html : '';
    if (!source.trim()) throw new BadRequestException('A page needs some HTML');
    if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) throw new BadRequestException('Pages are limited to 200 KB');
    const authorId = typeof input.authorId === 'string' ? input.authorId : '';
    const author = await this.store.db.people.findOne({ _id: authorId });
    if (!author) throw new BadRequestException('Pick who is publishing');

    const html = sanitize(source);
    const text = extractText(html);
    const now = new Date();
    const { sites, revisions } = this.store.db;

    let n = 1;
    try {
      await sites.insertOne({
        _id: address,
        authorId,
        title,
        text,
        currentRevisionId: `${address}@1`,
        revisionCount: 1,
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
      // Taken. Only the author may add a revision; $inc hands out n atomically.
      const updated = await sites.findOneAndUpdate(
        { _id: address, authorId },
        { $inc: { revisionCount: 1 }, $set: { title, text, updatedAt: now } },
        { returnDocument: 'after' },
      );
      if (!updated) {
        const owner = await sites.findOne({ _id: address });
        const ownerName = owner && (await this.store.db.people.findOne({ _id: owner.authorId }))?.name;
        throw new ConflictException(`${address} already belongs to ${ownerName ?? 'someone else'}`);
      }
      n = updated.revisionCount;
    }

    const rev: RevisionDoc = { _id: `${address}@${n}`, address, n, title, source, html, text, authorId, createdAt: now };
    await revisions.insertOne(rev);
    if (n > 1) {
      // Point at the new revision only once it exists, and only if no later edit has landed meanwhile.
      await sites.updateOne({ _id: address, revisionCount: n }, { $set: { currentRevisionId: rev._id } });
    }
    return this.toRevision(rev, author.name);
  }
}

@Controller()
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get('sites')
  list() {
    return this.sites.list();
  }

  @Get('sites/:address')
  async resolve(@Param('address') address: string) {
    const rev = await this.sites.resolve(address);
    if (!rev) throw new NotFoundException({ statusCode: 404, message: 'nowhere', address: normalizeAddress(address) });
    return rev;
  }

  @Get('revisions/:id')
  async revision(@Param('id') id: string) {
    const rev = await this.sites.revision(id);
    if (!rev) throw new NotFoundException(`no revision ${id}`);
    return rev;
  }

  /** What the author wrote, before sanitizing: for editing and for "view source". */
  @Get('revisions/:id/source')
  async source(@Param('id') id: string) {
    const source = await this.sites.source(id);
    if (source === null) throw new NotFoundException(`no revision ${id}`);
    return { id, source };
  }

  @Post('sites')
  publish(@Body() body: PublishInput) {
    return this.sites.publish(body ?? {});
  }
}
