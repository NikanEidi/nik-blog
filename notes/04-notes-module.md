# 04: Notes module — categories, Markdown storage, reusing `toSlug`

## What this does

A `notes` table and CRUD API, same public-read/admin-write shape as Projects: `GET /notes`, `GET /notes/:slug` public; `POST/PUT/DELETE /notes` admin-only.

```
backend/services/noteService.js
backend/controllers/notesController.js
backend/routes/notes.js
```

## Categories — real domains, not a generic "general" bucket

```sql
category TEXT NOT NULL CHECK (category IN ('ai-ml', 'backend', 'infrastructure', 'ios', 'dsa'))
```

First draft had a `project-deep-dive` category, which turned out to be the wrong axis: that's describing the *kind* of note, not its *tech domain*. A note about LedgerLite's auth flow is a `backend` note that happens to be about a specific project — those are two independent facts, not one. That's what `project_id` (below) is for, kept deliberately separate from `category`.

The five categories were chosen to match Nikan's real project mix (langchain-practice/CineVision → `ai-ml`; Fragments/LedgerLite/this project → `backend`; k8s-practice → `infrastructure`; HC → `ios`; Exercises/dsa → `dsa`) instead of a generic bucket like "general" — the kind of section names a real tech blog uses, not a catch-all.

## `project_id` — optional, independent of category

```sql
project_id INTEGER REFERENCES projects(id)
```

A nullable foreign key. Most notes won't be about one specific project (e.g. a general DSA note), so this has to be optional. When it is set, it's a real `REFERENCES` constraint — Postgres won't let it point at a project that doesn't exist, unlike if this were just a plain integer column.

## Content stored as raw Markdown, not a custom format

Considered building a dedicated rich-text engine for notes before settling on raw Markdown text (`content TEXT NOT NULL`), rendered client-side later with `react-markdown` (see `notes/05-frontend-pages.md`). Rejected the custom-engine idea: Markdown is already how every note in this project (and `langchain-practice/notes/`, `k8s-practice`) gets written, so storing it as-is means writing a note in the future admin panel will feel identical to writing one of these `.md` files by hand — no new format to learn, no extra engineering for a problem a well-known library already solves.

## Reusing `toSlug` instead of duplicating it

```js
const { toSlug } = require('./projectService');
```

`noteService.js` imports the slug-generation function from `projectService.js` rather than redefining it. Turning a title into a URL-safe slug has nothing to do with "being a project" — it's a generic string operation, so there's no reason two separate copies of the same regex should exist and risk drifting apart.

## Two-layer validation: app code, then the database

```js
const VALID_CATEGORIES = ['ai-ml', 'backend', 'infrastructure', 'ios', 'dsa'];
if (!VALID_CATEGORIES.includes(category)) {
  return res.status(400).json({ status: 'error', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
}
```

The database's `CHECK` constraint would reject an invalid category anyway, but its error message is a raw Postgres constraint-violation string — not something to show a user filling out an admin form. Checking in the controller first means a bad request gets a clear, specific message before it ever reaches the database; the `CHECK` constraint stays as the last line of defense in case something bypasses the API entirely (a script, a future second client).

## Closed a real gap found while building this

`GET /projects` and `GET /projects/:slug` were returning rows of **every** status, including `draft` — meaning every GitHub-synced repo (defaults to `draft`) was already publicly visible before ever being reviewed. Added `listPublishedProjects()` / `getPublishedProjectBySlug()` (and the equivalent `listPublishedNotes()` / `getPublishedNoteBySlug()` for this module) so public routes only ever return `status = 'published'` rows; the original unfiltered functions stay in place for a future admin-only "see everything, including drafts" view.

## Verified live

- Created a note via `POST /notes` with a JWT — came back `status: 'draft'` by default, slug auto-generated (`"Test Note"` → `"test-note"`).
- `GET /notes` (public, no token) → did not include it, confirming the draft filter works.
- `POST /notes` without a token → `401 Missing or malformed Authorization header`.

## One-line interview answer

> "Categories are real tech-domain tags matched to the actual project portfolio, not a generic 'general' bucket, and they're deliberately independent of which project a note is about — that's a separate optional foreign key, because a note's subject area and the specific project it discusses are two different facts. Validation happens twice: a clear message from the application layer first, with the database's CHECK constraint as the real last line of defense."
