# smallweb

Node 20+. Four terminals, from the repo root.

```bash
npm install
```

```bash
npm run db        # local MongoDB on :27019, data in .data/ (skip if you set MONGO_URL)
```

```bash
npm run seed      # idempotent; `npm run seed -- --reset` wipes the database first
```

```bash
npm run dev:api   # NestJS on http://127.0.0.1:4100
```

```bash
npm run dev:web   # Next.js on http://localhost:3100
```

```bash
npm test          # shared + api unit tests
```

Environment: `MONGO_URL` (default `mongodb://127.0.0.1:27019/smallweb`), `PORT` for the API (default 4100), `API_URL` for the web app (default `http://127.0.0.1:4100`).
