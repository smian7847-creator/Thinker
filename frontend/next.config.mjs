import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:4100';

/** @type {import('next').NextConfig} */
export default {
  // This repo is the workspace root, whatever lockfiles live above it.
  outputFileTracingRoot: join(dirname(fileURLToPath(import.meta.url)), '..'),
  // The browser talks to the API through the same origin.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/:path*` }];
  },
};
