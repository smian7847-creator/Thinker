// Runs a local MongoDB for development when you don't have one.
// If MONGO_URL is set, use that instead and you don't need this at all.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = resolve(import.meta.dirname, '..', '.data', 'db');
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27019, ip: '127.0.0.1', dbPath, storageEngine: 'wiredTiger' },
});
console.log(`mongod running at ${server.getUri()}thinker (data in .data/db). Ctrl+C to stop.`);

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
