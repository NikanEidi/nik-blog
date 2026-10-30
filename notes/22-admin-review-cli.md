# 22: Admin review CLI — interactive GitHub/notes review, and a production-vs-local database mistake

## What this does

`backend/scripts/review-cli.js` — a terminal tool (`npm run review`) that fetches my GitHub repos, finds ones not yet in the database, and asks me one by one whether to publish each one (with its auto-detected tags) or skip it permanently. A second pass lets me point it at a local folder of `.md` notes and add new ones, linked to a project, with a category.

```
backend/scripts/review-cli.js         -- the interactive CLI itself
backend/scripts/migrate-prod-status.js -- one-off: adds 'skipped' to the production DB's status CHECK constraint
```

## The 'skipped' status

`projects.status` was `draft`/`published` only. A GitHub-synced project that's still `draft` and I say "no" to needs to stay "no" forever, not get re-asked every sync -- so I added a third value, `skipped`, with its own migration in `schema.sql` (drop + re-add the CHECK constraint, same pattern as the earlier `notes_category_check` removal). `notes` never got this -- only projects go through GitHub auto-sync, so `VALID_STATUSES` in `adminController.js` had to split into `VALID_PROJECT_STATUSES` and `VALID_NOTE_STATUSES`, otherwise the note-status endpoint would accept `'skipped'` and the database would reject it with a confusing error.

## The real mistake: ran it against the wrong database, twice

First run: `npm run review` used `backend/.env`'s `DATABASE_URL`, which pointed at the **local Docker Postgres** (`localhost:5434`, from `docker-compose.yml`), not the real Neon database the live site (Render) actually reads from. Everything looked like it worked -- correct prompts, correct answers saved -- but the live site never changed, because it was never touched. Classic "it ran successfully" ≠ "it did what I meant."

Fixed by running it again with `DATABASE_URL` pointing at the real Neon connection string. First attempt at that failed too -- passing the connection string inline on the command line broke on the `&` in `?sslmode=require&channel_binding=require`, which bash treats as a special character. Fixed by writing a tiny one-off script (`migrate-prod-status.js`) that reads `DATABASE_URL` from a local `.env.neon` file instead of a shell argument -- file content doesn't get shell-escaped, so special characters in the connection string are no longer a problem. `.env.neon` is `.gitignore`d and deleted right after use -- it only ever exists locally, briefly, for a deliberate one-off production write.

Also added a safety line at the top of `review-cli.js`: it now prints which database host it's about to write to (and flags it explicitly if it's `localhost`), so this specific mistake can't happen silently again.

**Lesson, not just a bug:** `backend/.env`'s `DATABASE_URL` should point at local dev by default. Writing to production should always be a deliberate, separate step (the `.env.neon` pattern), never the accidental default.

Related: [GitHub sync](03-github-sync.md) · [Backend deployed — Neon + Render](19-backend-deployed-neon-render.md)
