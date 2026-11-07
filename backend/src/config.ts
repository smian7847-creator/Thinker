/** Everything the backend reads from the environment, in one place. */
export const config = {
  port: Number(process.env.PORT ?? 4100),
  /**
   * Loopback by default: locally, browsers reach the API through the
   * frontend's /api proxy. A host like Render sets HOST=0.0.0.0.
   */
  host: process.env.HOST ?? '127.0.0.1',
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27019/thinker',
  /**
   * Set when the API sits behind a proxy (Render, the Vercel rewrite), so
   * the rate limiter counts the client in X-Forwarded-For, not the proxy.
   */
  trustProxy: process.env.TRUST_PROXY === '1',
  /** Largest request body accepted; a page's HTML is capped separately. */
  bodyLimit: '300kb',
} as const;
