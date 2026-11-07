# Thinker

Node 20+. Run each long-running command in its own terminal, from the repo root.

```bash
npm install
```

```bash
npm run db             # local MongoDB on :27019, data in .data/ (skip if you set MONGO_URL)
```

```bash
npm run seed           # idempotent; `npm run seed -- --reset` wipes the database first
                       # seeded sites' edit keys are written to .data/edit-keys.json
```

```bash
npm run dev:backend    # NestJS API on http://127.0.0.1:4100
```

```bash
npm run dev:frontend   # Next.js on http://localhost:3100
```

```bash
npm test               # shared + backend unit tests
```

Environment: `MONGO_URL` (default `mongodb://127.0.0.1:27019/thinker`), `PORT` for the backend (default 4100), `API_URL` for the frontend (default `http://127.0.0.1:4100`).

## Layout

```
shared/     Address rules, the back/forward session model, search terms, API types. Used by both sides.
backend/    NestJS API, one folder per feature:
  src/database/   Mongo connection and document schema
  src/people/     who you can browse and publish as
  src/sites/      publishing, revisions, sanitizing, edit keys
  src/visits/     recording and paging history
  src/search/     text search and snippets
  src/common/     rate limiting
  src/seed/       the seeded web and its browsing history
frontend/   Next.js browser:
  components/browser/  toolbar: back/forward, address bar, theme, person picker
  components/frame/    the sandboxed frame published pages render in
  components/pages/    start, site, search, history, publish, nowhere
  hooks/               the tab (history and navigation), visited links, theme
  lib/                 API client, history sync, storage, formatting
  styles/              theme tokens, chrome, pages
scripts/    local MongoDB runner
```

## Deploy

Both services deploy to Render from `render.yaml`, from the repo root (not a subfolder), so the shared package links.

1. Create a free MongoDB Atlas cluster; allow access from anywhere (0.0.0.0/0) and copy its connection string, with `/thinker` as the database name.
2. Seed it from your machine: `MONGO_URL="<atlas string>" npm run seed`
3. Render: New → Blueprint → this repo. Set `MONGO_URL` on `thinker-api`, and `API_URL` on `thinker-web` to `thinker-api`'s URL (e.g. `https://thinker-api.onrender.com`, no trailing slash).
4. If `thinker-web` built before `API_URL` was set, redeploy it: the `/api` proxy is fixed at build time.
