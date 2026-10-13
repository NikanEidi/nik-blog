# 00: Repo skeleton and Postgres

## What this does

Sets up a two-service monorepo — a separate backend and frontend, not one combined app — plus a local PostgreSQL database running in Docker, and proves both services and the database actually work before any real feature is built.

```
nik-blog/
├── backend/        Express REST API
├── frontend/        Next.js app
└── docker-compose.yml   Postgres 17
```

## Why two separate services, not one Next.js app

Next.js can host backend logic itself (API routes), and for a lot of projects that's the right call. Here it's deliberately split into `backend/` and `frontend/` as independent services talking over REST, because the goal of this project includes practicing real API design, auth, and multi-layer architecture — the kind of separation a larger team's system actually has. It also means each side can be deployed, scaled, and tested independently.

## `docker-compose.yml` — what it actually configures

```yaml
services:
  postgres:
    image: postgres:17
    ports:
      - "5434:5432"
    volumes:
      - nikblog_pg_data:/var/lib/postgresql/data
```

- `image: postgres:17` — pulls the official Postgres image, version pinned (not `latest`), so the environment is reproducible.
- `ports: "5434:5432"` — maps container port 5432 (Postgres' default) to host port 5434. The non-default host port is deliberate: another project (LedgerLite) already uses 5433 for its own Dockerized Postgres, so this avoids a port collision if both run at the same time.
- `volumes` — without this, the database's data lives only inside the container's writable layer and is wiped on `docker compose down -v` or container removal. The named volume (`nikblog_pg_data`) persists data on the host across container restarts and rebuilds.

## `db/pool.js` — why a connection pool, not a single connection

```js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

A web server handles many requests, often concurrently. Opening a fresh TCP connection to Postgres per request is slow and doesn't scale. A `Pool` keeps a small set of already-open connections ready; each query borrows one, uses it, and returns it. Every route in the app imports this same `pool` instance (`module.exports = pool`), so the whole app shares one pool instead of each file creating its own.

## Two health checks, on purpose

```js
router.get('/', (req, res) => res.json({ status: 'ok' }));          // liveness only
router.get('/db', async (req, res) => { await pool.query('SELECT NOW()'); ... }); // real DB check
```

`GET /health` only proves the Node process is running and responding — it says nothing about the database. `GET /health/db` actually executes a query, so it fails if Postgres is down or misconfigured even though the server itself is fine. In a real deployment, a load balancer or orchestrator would usually hit the shallow check for fast liveness probes, and a deeper check like this gets used for diagnosing "the app is up but broken" situations.

## A real mistake made and fixed here

The first `.env` load showed `injected env (0) from .env` — meaning dotenv found the file but read zero variables from it. Root cause: a formatting issue in the file itself (not a path problem — the file was in the right place). This is a common real-world gotcha: a `.env` loading silently with 0 variables usually means the file exists but is empty, has the wrong key names, or has a syntax issue (stray characters, wrong line endings) — not that the file is missing, which would usually throw instead.

## npm audit — a judgment call, not a reflex

Both `backend` and `frontend` installs reported vulnerabilities. In both cases, `npm audit fix --force` was deliberately **not** run, because the flagged packages (`nodemon`'s `braces` dependency, `jest`'s `sprintf-js`/`argparse` chain, and the frontend's eslint toolchain) are dev-only — they run on the developer's machine during development, never in the shipped application. Forcing the fix would have downgraded `nodemon` to a 2017-era `1.x` release and `jest` to `25.0.0`, a real functional regression, for a vulnerability class with effectively zero exposure in a dev-only dependency. Running `npm audit fix --force` reflexively on every warning, without reading what's actually affected, is itself a bad habit — understanding severity and blast radius matters more than a clean audit report.

## One-line interview answer

> "I split the backend and frontend into separate services on purpose, to practice real REST API design instead of using Next.js API routes for everything. Postgres runs in Docker with a named volume so data survives restarts, and the backend shares one connection pool across all routes instead of opening a connection per request."
