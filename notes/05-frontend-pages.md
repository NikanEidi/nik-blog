# 05: Frontend public pages — Server Components, Cache Components, Markdown

## What this does

Four public pages in the Next.js App Router, each reading real data from the backend API: `/projects`, `/projects/[slug]`, `/notes`, `/notes/[slug]`. No styling yet (deliberately deferred to Phase 5) — this phase is about the data layer and routing being correct.

```
frontend/lib/api.ts              — typed fetch helpers, one per backend resource
frontend/app/projects/page.tsx         — list
frontend/app/projects/[slug]/page.tsx  — detail
frontend/app/notes/page.tsx            — list
frontend/app/notes/[slug]/page.tsx     — detail, renders Markdown
```

## Server Components — fetching data with no `useEffect`

```tsx
export default async function ProjectsPage() {
  const projects = await getProjects();
  return ( ... );
}
```

The App Router's default component type is a **Server Component** — the function itself can be `async` and `await` a fetch directly, because it runs on the server, not in the browser. There's no loading state to manage, no `useEffect`, no client-side request after the page has already rendered empty. The HTML that reaches the browser already has the real data in it, which is also better for SEO — a search engine crawler sees the actual content immediately, not an empty shell waiting for JavaScript.

## `lib/api.ts` — one typed helper per resource, not scattered fetches

```ts
export type Project = { id: number; title: string; slug: string; ... };

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_URL}/projects`);
  const data = await res.json();
  return data.projects;
}
```

Every page imports from this one file instead of calling `fetch` directly. Two benefits: the shape of a `Project`/`Note` is defined once (TypeScript then catches it if a page tries to use a field that doesn't exist), and if the backend's response shape ever changes, there's exactly one place to fix it.

## Cache Components — why every page needs `export const instant = false`

First real bug of this phase: every page crashed with *"Next.js encountered uncached data during prerendering"*. Next.js 16 ships a feature called **Cache Components**, on by default, which tries to pre-build every route at compile time (like a static HTML file) for speed. That only works for data that doesn't change per-request. Our pages fetch live data from Postgres through the API — by definition not something that can be baked in at build time.

```tsx
export const instant = false;
```

This line opts a route out of that static pre-build and tells Next.js "render this fresh, on every request." It's the correct choice for now, since the content changes whenever a project or note is published. Revisit once there's a real caching strategy worth building (Phase 5, SEO/performance pass) — for a low-traffic personal site, correctness now matters more than shaving render time nobody will notice yet.

## Async `params` in dynamic routes

```tsx
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  ...
}
```

In current Next.js, the `params` object for a dynamic segment like `[slug]` is a `Promise`, not a plain object — it has to be awaited before its fields can be read. This is a real API change from older Next.js versions, worth knowing cold for "have you used the latest Next.js" interview questions.

## `notFound()` for a missing slug

```tsx
const project = await getProjectBySlug(slug);
if (!project) {
  notFound();
}
```

`notFound()` is a Next.js helper that immediately renders the framework's built-in 404 page. Used here when a slug in the URL doesn't match any project/note — cleaner than manually building a 404 response, and consistent site-wide.

## Rendering Markdown safely with `react-markdown`

```tsx
<ReactMarkdown>{note.content}</ReactMarkdown>
```

`note.content` is raw Markdown text stored exactly as written (see `notes/03...` — decided against a custom rich-text engine). `react-markdown` parses that text into real React elements (`<h1>`, `<strong>`, `<code>`, `<li>`) at render time — not via `dangerouslySetInnerHTML`, so there's no risk of injecting raw HTML/script content even though this is a single-admin site where that risk is already low.

## `rel="noopener noreferrer"` on external links

```tsx
<a href={project.github_url} target="_blank" rel="noopener noreferrer">
```

Opening a link in a new tab without this attribute gives that new page partial access back to `window.opener` (the original tab) — a known tab-nabbing vector. Cheap to add, standard practice for any `target="_blank"` link to a third-party site (GitHub, a live demo).

## Verified live

- `/projects` → real data from Postgres via the API (LedgerLite, the only `published` project at the time).
- `/projects/ledgerlite` → full detail page, GitHub/live links present.
- `/notes` → correctly empty while the only note was `draft`; correctly showed "Hello Markdown — backend" after flipping it to `published` via `PUT /notes/:id`.
- `/notes/hello-markdown` → Markdown rendered for real: `# Hello` became an actual heading, `**bold**`/`` `code` `` became real `<strong>`/`<code>` elements, the list became a real `<ul>`.

## One-line interview answer

> "The public pages are Server Components that fetch straight from the API with no client-side loading state, which is both simpler and better for SEO since the HTML already has real content in it. I had to explicitly opt each page out of Next.js 16's new Cache Components feature, since it defaults to statically pre-building routes and these pages serve live, frequently-changing data from Postgres."
