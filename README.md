# Nik-Blog

**A portfolio and blog built as a real multi-layer application** — a REST API with authentication, a public site, and a private admin panel, instead of a static page. Built to demonstrate full-stack engineering practice: API design, auth, testing, and a genuine (not decorative) use of embeddings-based search.

> Personal project, in progress. See [`PLAN.md`](../nikan-career-assistant/projects-in-progress/nik-blog/PLAN.md) in the career-assistant repo for the full scope, phase-by-phase plan, and progress log.

---

## What this will be

- A public site with project write-ups and working notes (including a dedicated DSA/practice section).
- A private `/admin` area (JWT-protected) to publish and edit content — no separate CMS, no manual file editing.
- A "Learning Journal" view for practice problems: the real path from first attempt to bug to fix, not just the polished final answer.
- A live GitHub activity indicator and live CI/test badges per project, pulled from real data.
- Semantic search ("ask my notes") over published notes using embeddings — a working feature, not a demo.

## Architecture (planned)

```
backend/   Node.js + Express REST API, PostgreSQL, JWT auth
frontend/  Next.js (App Router) + TypeScript + Tailwind CSS
```

Two independent services talking over REST, deployed separately (frontend on Vercel, backend + database on Render/Railway).

## Status

**Phase 0 — repo skeleton.** Both services boot; `backend` connects to a local PostgreSQL via Docker Compose. Nothing beyond that is implemented yet — no auth, no content model, no admin UI. Nothing here is claimed as finished until it actually works end to end.

## Local development

**Requirements:** Node.js, Docker.

```bash
# start the database
docker compose up -d

# backend
cd backend
npm install
node index.js        # http://localhost:3001

# frontend (separate terminal)
cd frontend
npm install
npm run dev           # http://localhost:3000
```

## License

Not yet decided — will be added before this is made public.
