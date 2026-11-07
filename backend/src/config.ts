/** Everything the backend reads from the environment, in one place. */
export const config = {
  port: Number(process.env.PORT ?? 4100),
  /** Loopback only: browsers reach the API through the frontend's /api proxy. */
  host: '127.0.0.1',
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27019/thinker',
  /** Largest request body accepted; a page's HTML is capped separately. */
  bodyLimit: '300kb',
} as const;
