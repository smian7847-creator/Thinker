import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from '../config';

/**
 * A fixed-window limit per client and route, kept in memory. It is enough to
 * stop one script filling the web or someone's history; it resets when the
 * API restarts and is not shared between instances.
 */
export function rateLimit(name: string, limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method !== 'POST') return next();
    const now = Date.now();
    const key = clientOf(req);
    let w = hits.get(key);
    if (!w || w.resetAt <= now) {
      w = { count: 0, resetAt: now + windowMs };
      hits.set(key, w);
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    w.count += 1;
    if (w.count > limit) {
      res.setHeader('Retry-After', Math.ceil((w.resetAt - now) / 1000));
      res.statusCode = 429;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ statusCode: 429, message: `Too many ${name}; try again shortly` }));
      return;
    }
    next();
  };
}

// Locally the API listens on loopback, so only the frontend's proxy (or
// another local process) can set forwarded-for. Deployed behind a host's
// proxy, TRUST_PROXY=1 says the header is set by infrastructure we trust.
function clientOf(req: IncomingMessage): string {
  const remote = req.socket.remoteAddress ?? '';
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'];
  if ((loopback || config.trustProxy) && typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return remote;
}
