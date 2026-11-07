/**
 * npm run seed            idempotent: upserts the seeded web, keeps anything published since
 * npm run seed -- --reset drops the database first
 *
 * Every id and timestamp is derived from the seed data, so running this twice
 * changes nothing and the same addresses always hold the same pages.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ObjectId } from 'mongodb';
import { collections, connect, ensureIndexes, MONGO_URL, RevisionDoc, SiteDoc, VisitDoc } from '../db';
import { extractText, sanitize } from '../content';
import { hashEditKey, newEditKey } from '../editkeys';
import { PEOPLE } from './people';
import { SITES } from './sites';
import { linkGraph, rng, Step, walk } from './trails';

/** The browsing hour ends here; revisions are dated relative to it. */
export const SEED_EPOCH = new Date('2026-11-06T20:00:00Z');
const HOUR_START = SEED_EPOCH.getTime() - 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

function stableObjectId(key: string): ObjectId {
  return new ObjectId(createHash('sha1').update(`smallweb:${key}`).digest('hex').slice(0, 24));
}

// Edit keys are secrets, so they are random rather than derived from the seed,
// and live next to the local database, outside git.
const KEYS_FILE = resolve(__dirname, '..', '..', '..', '.data', 'edit-keys.json');

function readKeys(reset: boolean): Record<string, string> {
  if (reset || !existsSync(KEYS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(KEYS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeKeys(keys: Record<string, string>) {
  mkdirSync(dirname(KEYS_FILE), { recursive: true });
  writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2) + '\n');
}

function trails(): Step[] {
  const pages = Object.fromEntries(SITES.map((s) => [s.address, s.revisions[s.revisions.length - 1].html]));
  const graph = linkGraph(pages);
  const r = rng(20261106);
  const steps: Step[] = [
    // Ada wanders everywhere, preferring links she hasn't followed yet.
    ...walk(graph, r, { personId: 'ada', start: 'ring.zz', steps: 38, at: 0, pBack: 0.18, explore: true }),
    // Bruno goes round the same few pages, twice.
    ...walk(graph, r, { personId: 'bruno', start: 'sourdough.zz', steps: 9, at: 240, pBack: 0.45 }),
    ...walk(graph, r, { personId: 'bruno', start: 'sourdough.zz', steps: 7, at: 2400, pBack: 0.45 }),
    // Chen takes one long trail from the stars outwards.
    ...walk(graph, r, { personId: 'chen', start: 'stargazer.zz', steps: 16, at: 600, pBack: 0.12 }),
    // Dee arrives from search results, then browses a little each time.
    ...walk(graph, r, { personId: 'dee', start: 'tidepool.zz', startVia: 'search', steps: 3, at: 900, pBack: 0.3 }),
    ...walk(graph, r, { personId: 'dee', start: 'almanac.zz', startVia: 'search', steps: 3, at: 1500, pBack: 0.3 }),
    ...walk(graph, r, { personId: 'dee', start: 'saltmarsh.zz', startVia: 'search', steps: 4, at: 2100, pBack: 0.3 }),
    // Authors check their own pages.
    ...walk(graph, r, { personId: 'marina', start: 'tidepool.zz', steps: 4, at: 1800, pBack: 0.3 }),
    ...walk(graph, r, { personId: 'otto', start: 'almanac.zz', steps: 3, at: 3000, pBack: 0.3 }),
    ...walk(graph, r, { personId: 'june', start: 'shorebirds.zz', steps: 5, at: 1200, pBack: 0.25 }),
  ];
  // Ada also went straight to the page everyone was talking about.
  const adaLast = Math.max(...steps.filter((s) => s.personId === 'ada').map((s) => s.t));
  steps.push({ personId: 'ada', address: 'escape.zz', via: 'typed', from: null, t: Math.min(adaLast + 60, 3590) });
  return steps;
}

async function main() {
  const reset = process.argv.includes('--reset');
  const { client, db } = await connect();
  try {
    if (reset) await db.dropDatabase();
    const c = collections(db);
    await ensureIndexes(c);

    for (const p of PEOPLE) await c.people.replaceOne({ _id: p._id }, p, { upsert: true });

    const current = new Map<string, RevisionDoc>();
    const keys = readKeys(reset);
    for (const site of SITES) {
      const revs: RevisionDoc[] = site.revisions.map((r, i) => {
        const html = sanitize(r.html);
        return {
          _id: `${site.address}@${i + 1}`,
          address: site.address,
          n: i + 1,
          title: r.title,
          source: r.html.trim(),
          html,
          text: extractText(html),
          authorId: site.authorId,
          createdAt: new Date(SEED_EPOCH.getTime() - r.daysAgo * DAY),
        };
      });
      for (const rev of revs) await c.revisions.replaceOne({ _id: rev._id }, rev, { upsert: true });
      const last = revs[revs.length - 1];
      current.set(site.address, last);

      // If someone has published newer revisions since seeding, leave the pointer on theirs.
      const existing = await c.sites.findOne({ _id: site.address });
      if (existing && existing.revisionCount > revs.length) continue;
      // Keep a site's edit key across re-seeds; mint one the first time.
      let editKeyHash = existing?.editKeyHash;
      if (!editKeyHash) {
        const key = newEditKey();
        keys[site.address] = key;
        editKeyHash = hashEditKey(key);
      }
      const doc: SiteDoc = {
        _id: site.address,
        authorId: site.authorId,
        title: last.title,
        text: last.text,
        currentRevisionId: last._id,
        revisionCount: revs.length,
        editKeyHash,
        createdAt: revs[0].createdAt,
        updatedAt: last.createdAt,
      };
      await c.sites.replaceOne({ _id: site.address }, doc, { upsert: true });
    }

    writeKeys(keys);

    const steps = trails();
    const perPerson = new Map<string, number>();
    for (const s of steps) {
      const i = perPerson.get(s.personId) ?? 0;
      perPerson.set(s.personId, i + 1);
      const rev = current.get(s.address) ?? null;
      const visit: VisitDoc = {
        _id: stableObjectId(`visit:${s.personId}:${i}`),
        personId: s.personId,
        address: s.address,
        revisionId: rev?._id ?? null,
        title: rev?.title ?? null,
        via: s.via,
        from: s.from,
        at: new Date(HOUR_START + s.t * 1000),
      };
      await c.visits.replaceOne({ _id: visit._id }, visit, { upsert: true });
    }

    const [people, sites, revisions, visits] = await Promise.all([
      c.people.countDocuments(),
      c.sites.countDocuments(),
      c.revisions.countDocuments(),
      c.visits.countDocuments(),
    ]);
    const nowhere = steps.filter((s) => !current.has(s.address)).length;
    const adaSites = new Set(steps.filter((s) => s.personId === 'ada' && current.has(s.address)).map((s) => s.address));
    console.log(`seeded ${MONGO_URL}${reset ? ' (reset)' : ''}`);
    console.log(`  people ${people}, sites ${sites}, revisions ${revisions}, visits ${visits}`);
    console.log(`  this seed: ${steps.length} visits (${nowhere} to nowhere); ada has seen ${adaSites.size}/${SITES.length} sites`);
    for (const [p, n] of perPerson) console.log(`    ${p.padEnd(7)} ${n}`);
    console.log(`  edit keys for seeded sites: ${KEYS_FILE}`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
