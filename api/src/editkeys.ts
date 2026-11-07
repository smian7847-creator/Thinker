import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * There are no accounts, so "who you are" is whatever name a request claims.
 * Ownership of a site is held by a capability instead: whoever first claims
 * an address is handed a random edit key, and only a request carrying that
 * key can add a revision. The server keeps a hash, never the key.
 */

export function newEditKey(): string {
  return randomBytes(24).toString('base64url');
}

export function hashEditKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function editKeyMatches(key: unknown, hash: string | undefined): boolean {
  if (typeof key !== 'string' || !key || !hash) return false;
  const a = Buffer.from(hashEditKey(key), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
