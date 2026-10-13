# 02: Projects module — public reads, admin-only writes

## What this does

A `projects` table with public read endpoints (anyone can browse) and admin-only write endpoints (only a valid JWT can create/edit/delete) — the first module where a single route file mixes public and protected routes.

```
GET    /projects          public — list all
GET    /projects/:slug    public — one project
POST   /projects          admin only (requireAuth)
PUT    /projects/:id      admin only
DELETE /projects/:id      admin only
```

## Why `slug` instead of just using the numeric `id` in URLs

A URL like `/projects/7` tells a visitor nothing. `/projects/ledgerlite` is readable, shareable, and better for SEO (search engines weight meaningful URL text). The slug is generated automatically from the title, not typed by hand, so it can never drift out of sync with what the admin actually types as the title.

```js
function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

`[^a-z0-9]+` is a regex **character class with negation** — `[abc]` matches any of a, b, c; `[^abc]` matches anything *except* a, b, c. So this matches one-or-more characters that are not a lowercase letter or digit (spaces, punctuation, em-dashes) and replaces each run of them with a single `-`. The second `.replace` strips a leading or trailing dash, in case the title started or ended with punctuation.

## `tech_stack TEXT[]` — a native array column

```sql
tech_stack TEXT[] NOT NULL DEFAULT '{}'
```

Postgres supports array columns directly — no separate join table needed for something as simple as a list of tech-stack tags. The tradeoff: this only makes sense because tech-stack tags are never queried relationally (e.g. "find every project using React" doesn't need to be a fast indexed query here). If that kind of querying mattered, a proper `project_tags` join table would be the right call instead.

## `RETURNING *`

```sql
INSERT INTO projects (...) VALUES (...) RETURNING *
```

Without `RETURNING`, an `INSERT` just confirms success — getting the newly created row (with its generated `id`, default `created_at`, etc.) back would need a second `SELECT`. `RETURNING *` hands back the final row in the same round trip. The same applies to the `UPDATE` query, which uses it to confirm what the row looks like after the change.

## Mixed public/private routes in one file

```js
router.get('/', controller.list);                    // no middleware
router.post('/', requireAuth, controller.create);     // requireAuth first
```

`requireAuth.js` (from the auth module) isn't applied to the whole router — it's passed as a middle argument only on the routes that need it. Express runs middleware arguments left to right before the final handler, so `requireAuth` runs, and only calls `next()` to let `controller.create` execute if the token is valid. The public `GET` routes skip straight to their handler with no gate at all.

## Verified live

- Created a project with a valid token — slug generated correctly (`"LedgerLite"` → `"ledgerlite"`).
- Read it back two ways with zero authentication: list endpoint and by-slug endpoint.
- Confirmed the write endpoint actually enforces auth: the same `POST` without a token returns `401` with `requireAuth`'s error, never reaching the controller.

## One-line interview answer

> "Reads are public and writes require a valid JWT, enforced per-route rather than for the whole router — so one route file cleanly mixes public and admin-only endpoints. Slugs are generated server-side from the title with a regex, so the URL and the displayed title can never drift apart."
