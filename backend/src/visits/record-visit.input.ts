import { BadRequestException } from '@nestjs/common';
import { normalizeAddress, Via, VIAS } from '@thinker/shared';

/** A visit as the client reports it, after validation. */
export interface RecordVisitInput {
  address: string;
  /** The revision that was shown, or null if the address led nowhere. */
  revisionId: string | null;
  via: Via;
  from: string | null;
}

export function parseRecordVisitInput(body: unknown): RecordVisitInput {
  const b = (body ?? {}) as Record<string, unknown>;

  const address = typeof b.address === 'string' ? normalizeAddress(b.address) : null;
  if (!address) throw new BadRequestException('visits are to addresses');

  const via = b.via as Via;
  if (!VIAS.includes(via)) throw new BadRequestException(`via must be one of ${VIAS.join(', ')}`);

  if (b.revisionId != null && typeof b.revisionId !== 'string') {
    throw new BadRequestException('revisionId is a revision id or null');
  }
  const revisionId = (b.revisionId as string | null | undefined) ?? null;
  const from = typeof b.from === 'string' ? normalizeAddress(b.from) : null;

  return { address, revisionId, via, from };
}
