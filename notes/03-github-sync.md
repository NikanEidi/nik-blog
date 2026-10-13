# 03: GitHub sync — keeping projects in sync without losing manual edits

## What this does

A CLI script (`node scripts/sync-github.js`) that fetches every public, non-fork repo from the GitHub API and syncs it into the `projects` table — without ever overwriting a project's `status` or clashing with a project that was already created by hand.

```
backend/services/githubService.js   — talks to the GitHub API only
backend/services/projectService.js  — upsertFromGithub(): talks to the database only
backend/scripts/sync-github.js      — orchestrates both, run manually with node
```

## Why two separate services instead of one

`githubService.js` knows nothing about Postgres. `projectService.js` knows nothing about GitHub. Each service only talks to one outside system. If a second source ever gets added (e.g. GitLab), it becomes a new `gitlabService.js` — `projectService.js` doesn't change at all, because it only cares about rows, not where the data came from.

## Matching logic — three cases, in order

```js
// 1. Already synced before? Match by github_url (works for both
//    source='github' rows and a manual row that got linked in case 2).
const byUrl = await pool.query('SELECT id FROM projects WHERE github_url = $1', [github_url]);
if (byUrl.rows.length > 0) { /* UPDATE metadata only, leave status/source alone */ }

// 2. Not matched by URL — does a manual project already own this slug?
//    (e.g. LedgerLite was created by hand before this script ever ran.)
const slugOwner = await pool.query('SELECT id FROM projects WHERE slug = $1', [slug]);
if (slugOwner.rows.length > 0) { /* adopt it: link github_url, refresh metadata, keep status/source */ }

// 3. Neither matched — genuinely new repo.
/* INSERT with source='github', status='draft' */
```

The first version of this script only checked case 1 with `AND source = 'github'`, so a manual project with a matching slug wasn't found — the `INSERT` in case 3 ran anyway and Postgres rejected it with `duplicate key value violates unique constraint "projects_slug_key"` (the `slug` column is `UNIQUE`). Case 2 is what fixed that: instead of crashing, or just skipping the repo entirely, the existing manual row gets GitHub's metadata (description, tech stack, live URL) attached to it going forward, while its `status` and `source` are left exactly as they were.

## Why `status`/`source` are never in the `SET` clause of an UPDATE

```sql
UPDATE projects SET title = $1, description = $2, tech_stack = $3, live_url = $4, updated_at = NOW() WHERE id = $5
```

Once a row exists, this query only ever touches content fields. `status` isn't listed, so whatever it currently is — `draft` or `published` — survives every re-sync untouched. This is the core guarantee of the whole script: **running sync again and again can never un-publish something you already approved**, and it can never quietly flip a manual project into looking auto-generated.

## Why `source` is set on INSERT only, never on UPDATE

- A manually created project (`POST /projects`) never sends `source` at all — the column's `DEFAULT 'manual'` in `schema.sql` fills it in automatically.
- A GitHub-inserted project sets `source = 'github'` directly in the `INSERT` statement, hardcoded (not a bound parameter, since it's always the same literal value here).
- No `UPDATE` statement in this file lists `source` in its `SET` clause. A row's `source` is decided once, at the moment it's first inserted, and never changes after that — which is exactly why the adopted LedgerLite row kept `source = 'manual'` even after being linked to its `github_url`.

## Why the loop awaits one repo at a time instead of `Promise.all`

```js
for (const repo of repos) {
  const { wasInserted } = await projectService.upsertFromGithub(repo);
  ...
}
```

This runs manually, at most a few times a week — speed doesn't matter here. Running queries one at a time avoids any risk of two queries racing to insert the same slug at once, and keeps the error output readable (one failure at a time, not 36 at once).

## Verified live

- First run crashed on the `ledgerlite` slug collision (confirmed the bug was real, not theoretical).
- After the fix: `node scripts/sync-github.js` → `Synced 36 repos: 14 inserted, 22 updated.` (the 22 "updated" were repos already inserted during the crashed first run — each `INSERT` commits immediately, so a mid-loop crash still leaves earlier rows in the database).
- Confirmed `ledgerlite` kept `source = 'manual'`, `status = 'published'`, and gained a `github_url` — proving the adopt-by-slug path works without resetting anything.
- Diffed the full list of public, non-fork GitHub repos against `SELECT title FROM projects` — exact match, nothing missing, nothing extra.

## One-line interview answer

> "The sync is idempotent and safe to re-run: it matches existing rows by GitHub URL first, falls back to matching by slug so it can adopt a project that was already created by hand, and only ever touches content fields — status and source are set once on insert and never touched again, so re-syncing can't silently un-publish or relabel something a human already curated."
