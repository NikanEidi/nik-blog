# Nik-Blog — Learning Notes

One note per real piece of work on this project: what we built, why it's built that way, and the syntax/logic explained — same format as `langchain-practice/notes/` and `k8s-practice`. These are written from the actual build sessions, not from theory, so every note ends with something defensible in an interview.

## Index

| # | Note | Covers |
|---|------|--------|
| 00 | [Repo skeleton and Postgres](00-repo-skeleton-and-postgres.md) | Monorepo layout, Express/Next.js scaffolding, Docker Compose Postgres, connection pooling |
| 01 | [Admin auth](01-admin-auth.md) | Layered backend architecture, bcrypt hashing, JWT issuing/verification, auth middleware |
| 02 | [Projects CRUD](02-projects-crud.md) | Public/protected routes in one file, slug generation, Postgres array columns, `RETURNING *` |
| 03 | [GitHub sync](03-github-sync.md) | Idempotent upsert logic, matching by URL vs. slug, never resetting status/source on re-sync |
| 04 | [Notes module](04-notes-module.md) | Real tech-domain categories, Markdown-as-data, reusing `toSlug`, app-layer + DB-layer validation |
| 05 | [Frontend public pages](05-frontend-pages.md) | Server Components, Next.js 16 Cache Components opt-out, async `params`, rendering Markdown safely |
| 06 | [Admin auth cookies](06-admin-auth-cookies.md) | HTTP-only cookie vs. localStorage, CORS credentials, Client Components, checking auth via a real API call |
| 07 | [Note create/edit forms](07-note-forms.md) | Shared form component via a `mode` prop, resending unchanged fields on update, fixing a `useParams()`/Cache Components conflict |
| 08 | [Image uploads to S3](08-image-uploads-s3.md) | Least-privilege IAM, scoped bucket policy, multer memory storage, random filenames, multipart form uploads |
| 09 | [Noir design system](09-noir-design-system.md) | Tailwind v4 CSS tokens, editorial layout, ref-based cursor glow (no re-renders), inline SVG grain texture |
| 10 | [Glitch + cursor-proximity tint](10-glitch-and-cursor-proximity.md) | Diagnosing a stale Turbopack CSS cache vs. a silently-dropped Lightning CSS rule, distance-based color blending in JS |
| 11 | [Dossier grid + Live Pulse](11-dossier-grid-and-proximity.md) | Replacing decorative numbers with real GitHub data, a reusable proximity-tint hook, point-to-rectangle distance fix |
| 12 | [Admin panel design + logout](12-admin-panel-design-and-logout.md) | Applying noir tokens to a utility screen without its ambient effects; missing logout, delete, and `nodemon` script found and fixed; a Projects/Notes tab switcher; uploading a local `.md` file straight into the Note form |

More notes get added as each phase of `PLAN.md` is finished.
