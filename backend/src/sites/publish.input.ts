import { BadRequestException } from '@nestjs/common';
import { normalizeAddress } from '@thinker/shared';

export const MAX_SOURCE_BYTES = 200_000;
export const MAX_TITLE_LENGTH = 120;

/** A publish request after validation. */
export interface PublishInput {
  address: string;
  title: string;
  source: string;
  authorId: string;
  /** Present when adding a revision to an address already claimed. */
  editKey?: string;
}

/** Validates an untrusted request body. Every field is type-checked before it can reach a query. */
export function parsePublishInput(body: unknown): PublishInput {
  const b = (body ?? {}) as Record<string, unknown>;

  const address = typeof b.address === 'string' ? normalizeAddress(b.address) : null;
  if (!address) throw new BadRequestException('An address looks like name.zz: letters, digits and hyphens, ending in .zz');

  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title || title.length > MAX_TITLE_LENGTH) {
    throw new BadRequestException(`A title is required, up to ${MAX_TITLE_LENGTH} characters`);
  }

  const source = typeof b.html === 'string' ? b.html : '';
  if (!source.trim()) throw new BadRequestException('A page needs some HTML');
  if (Buffer.byteLength(source) > MAX_SOURCE_BYTES) throw new BadRequestException('Pages are limited to 200 KB');

  const authorId = typeof b.authorId === 'string' ? b.authorId : '';
  if (!authorId) throw new BadRequestException('Pick who is publishing');

  const editKey = typeof b.editKey === 'string' && b.editKey ? b.editKey : undefined;
  return { address, title, source, authorId, editKey };
}
