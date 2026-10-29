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
| 13 | [Project detail page design](13-project-detail-page-design.md) | The last unstyled public page, reusing `LivePulse`, a Related Notes section, and a missing Project field in the Note form that made it reachable |
| 14 | [Free-text category tags](14-free-text-category-tags.md) | Dropping a database CHECK constraint, a `<datalist>` for autocomplete without enforcement, why the existing color fallback needed zero changes |
| 15 | [Notes grouped by category + breadcrumbs](15-notes-grouped-by-category-and-breadcrumbs.md) | Grouping with a `Map` to preserve insertion order, completing the back-link chain from detail page to list page to home |
| 16 | [Tag colors simplified + footer](16-tag-colors-simplified-and-footer.md) | One fixed tag accent instead of five, dropping the proximity-to-white glass effect, a `new Date()` prerendering bug in the new footer |
| 17 | [Mermaid + syntax highlighting](17-mermaid-and-syntax-highlighting.md) | A server-side rehype plugin for code highlighting vs. a Client Component for mermaid (only mermaid needs the DOM), intercepting at `<pre>` not `<code>` |
| 18 | [Video uploads for project covers](18-video-uploads.md) | MP4/WebM over GIF and why, no schema change needed, a real `<video>` vs `<img>` verification with a generated test clip |
| 19 | [Backend deployed — Neon + Render](19-backend-deployed-neon-render.md) | Fixing hardcoded localhost CORS/cookie settings before going live, a flaky `search_path` bug caused by a connection pooler, why a direct connection beat the pooled one |
| 20 | [Infrastructure as Code](20-infrastructure-as-code.md) | Bringing the real, already-running S3 bucket + IAM user under Terraform with `terraform import`, not destroying and recreating; a dedicated read-only IAM user; a real `HeadBucket`/`s3:ListBucket` permissions wall; verifying zero drift with `terraform plan` before trusting any of it |
| 21 | [Nik-Blog Assistant — RAG chatbot](21-nik-blog-assistant-rag-chatbot.md) | pgvector + local embeddings, a cosine-distance threshold (not just `LIMIT`) to stop irrelevant chunks being forced into context, switching providers after a Gemini free-tier wall (20 req/day), a pre-existing dotenv/CORS ordering bug, and auto-reindexing a project/note's chunks on every publish/edit/unpublish/delete |

More notes get added as each phase of `PLAN.md` is finished.
