# 07: Admin create/edit forms — a shared component, and a real Client Component bug

## What this does

`/admin/notes/new` and `/admin/notes/[id]/edit` — real forms in the admin panel to write and edit notes, instead of hand-typing `curl` commands. Both pages reuse one form component instead of duplicating the same fields twice.

```
backend/services/noteService.js         — new getNoteById()
backend/controllers/adminController.js  — new getNoteById (admin-only, any status)
backend/routes/admin.js                 — GET /admin/notes/:id

frontend/components/NoteForm.tsx        — shared form, mode: 'create' | 'edit'
frontend/components/EditNoteClient.tsx  — fetches the note, then renders NoteForm
frontend/app/admin/notes/new/page.tsx
frontend/app/admin/notes/[id]/edit/page.tsx
```

## One form component, two modes

```tsx
export default function NoteForm({
  mode,
  noteId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  noteId?: number;
  initialValues?: NoteFormValues;
}) {
```

Rather than a separate `CreateNoteForm` and `EditNoteForm` with nearly identical JSX, one component branches on `mode` for the two things that actually differ: which URL/HTTP method to submit to (`POST /notes` vs `PUT /notes/:id`), and whether the inputs start empty or pre-filled from `initialValues`. Every field, every input, the submit button — all shared.

## A real gotcha: `status` has to be resent on edit, or the update breaks

```ts
const body: Record<string, unknown> = { title, category, content };
if (mode === 'edit') {
  body.status = initialValues?.status ?? 'draft';
}
```

`noteService.updateNote` always writes `status = $5` in its `UPDATE` statement — it doesn't conditionally skip that column if the caller didn't send one. If the edit form only sent `title`/`category`/`content` (the fields the user can actually see and change), `status` would arrive as `undefined`, and `pg` throws rather than silently treating that as "leave it alone." The fix: the edit form resends the note's current status unchanged, as a value the user never sees or edits, alongside whatever they did change.

## The real bug: `useParams()` can't be used directly like this

First version of the edit page read the dynamic `:id` with the `useParams()` client hook, inside a `'use client'` page:

```tsx
'use client';
export default function EditNotePage() {
  const params = useParams(); // crashed
```

This failed with *"Next.js encountered URL data `useParams()` in a Client Component outside of `<Suspense>`"* — Next.js 16 wants to statically analyze a route's dynamic segments at build time where it can, and a raw client hook reading the URL blocks that. The error message's own suggested fix (`export const instant = false`) turned out to be wrong for this specific case too — that export only works in a **Server Component** module, and the whole file was `'use client'`.

The actual fix: split the page in two.

```tsx
// page.tsx — stays a Server Component (no 'use client'), reads params the
// same way the public /projects/[slug] page does (notes/05-frontend-pages.md)
export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditNoteClient id={id} />;
}
```

```tsx
// EditNoteClient.tsx — 'use client', receives id as a plain prop instead
// of reading the URL itself
export default function EditNoteClient({ id }: { id: string }) {
  useEffect(() => { /* fetch, credentials: 'include' */ }, [id]);
  ...
}
```

The Server Component does the one thing only a Server Component can do cleanly (read the dynamic route param), and hands it down as an ordinary prop — the Client Component never needs to know it came from a URL at all. This is a more general pattern worth remembering: when a client hook fights with how Next.js wants to prerender a route, moving the URL-reading part up to the nearest Server Component and passing the result down as a prop usually sidesteps the conflict entirely.

## Verified live

- `/admin/notes/new`: created a real note through the form; redirected to `/admin` and the new note appeared in the list as `draft`.
- `/admin/notes/3/edit`: opened with the existing note's title, category, and content already filled in; edited the content and saved; redirected back to `/admin` with no error, confirming `status` survived the round trip unchanged.

## One-line interview answer

> "One form component serves both create and edit by branching on a `mode` prop for the two things that actually differ — the submit target and whether fields start empty or pre-filled — and the edit page reads its dynamic `:id` in a thin Server Component wrapper instead of a client-side `useParams()` hook, since Next.js 16 can't statically prerender a route whose only source of its own URL param is a raw client hook."
