# 19: Backend deployed — Neon Postgres + Render, and a flaky `search_path` bug caught before it hit production

## What this does

Backend is live: Postgres on Neon (free tier, persists indefinitely — Render's own free Postgres expires after 30 days, so I went with Neon for the database specifically and kept Render for the Node process), Express API deployed as a Render Web Service. Migrated every real row from my local dev database rather than re-syncing from GitHub and losing all my manual curation (pinned/published status, uploaded images).

```
backend/db/schema.sql applied directly to Neon via psql (through the local
Docker Postgres container, since psql isn't installed on my machine)
pg_dump --data-only + restore to copy every real row across
```

## CORS and cookie settings were still hardcoded to localhost

Found before deploying, not after: `index.js`'s CORS config and the auth cookie's `sameSite`/`secure` flags were still dev-only values from when this was built (`origin: 'http://localhost:3000'`, `sameSite: 'lax'`, `secure: false`). None of that would work once frontend and backend live on two different real domains (Vercel + Render) — a cross-site cookie needs `sameSite: 'none'` + `secure: true`, and CORS needs the real frontend origin, not localhost. Fixed both to read from `process.env.FRONTEND_URL` / `process.env.NODE_ENV === 'production'`, verified locally that dev behavior is unchanged (still plain `SameSite=Lax`, no `Secure` flag, confirmed via a real login request).

## A genuinely confusing bug: tables that existed, then didn't, then did again

Ran `schema.sql` against Neon, confirmed the 3 tables existed with `\dt`. Minutes later — after sharing screenshots, no schema changes on my end — a verification query failed with `relation "projects" does not exist`. Re-ran the schema creation: `ERROR: no schema has been selected to create in`. That specific error means the role's `search_path` is empty, not that the schema itself is gone — confirmed with `SHOW search_path;`, which came back blank for `neondb_owner`.

```sql
ALTER ROLE neondb_owner SET search_path = public;
ALTER DATABASE neondb SET search_path = public;
```

That's the correct permanent fix — but it didn't take effect reliably on the connection string I was using, the one with `-pooler` in the hostname (Neon's PgBouncer-based connection pooler). Some fresh connections through it picked up the corrected default, others still came back with an empty `search_path` — a real caching quirk of pooled connections serving stale per-session state from before the `ALTER`.

**The actual fix:** stop using the pooler connection string at all. Tested the direct (non-pooler) endpoint with 5 separate fresh connections — consistent every time. Switched Render's `DATABASE_URL` to the direct connection string. This isn't just a workaround for the one bug — it's the architecturally correct choice here: the backend already manages its own connection pool (`db/pool.js`, a `pg.Pool`), so adding Neon's own pooler on top is redundant for a long-running server process. Neon's pooler exists mainly for short-lived/serverless callers (like edge functions) that can't hold their own pool open — not for a process like this one that already does.

## Verified live

- `curl https://nik-blog.onrender.com/health` → `200`.
- `GET /projects` → 8 results (published only — the public endpoint correctly filters out the 28 drafts, matching local exactly).
- `GET /notes` → 15 results, matching local exactly (0 lost in migration).
- Directly queried Neon via the (now-reliable) direct connection: `published: 8, draft: 28` — 36 total, confirmed against the real local count before migrating, not just trusted blindly.
- Confirmed the connection fix is actually stable, not a one-off: 5 consecutive fresh connections through the direct endpoint all returned correct, consistent results before trusting it enough to put in Render's env vars.

## One-line interview answer

> "A table that silently 'disappeared' between two otherwise-identical commands wasn't actually gone — `search_path` had been reset to empty on the role, which looks identical to a missing schema at a glance but needs a completely different fix. The deeper issue was that the pooled connection endpoint I was using cached stale session state from before the role fix, which is also exactly why a long-running server with its own connection pool shouldn't be going through an external pooler meant for short-lived serverless callers in the first place."
