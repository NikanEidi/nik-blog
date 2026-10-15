# 13: Project detail page design, and a real-data fix for "too empty" feedback

## What this does

`/projects/[slug]` was still plain unstyled HTML from Phase 2 (before `DESIGN.md` existed) — the one remaining public page that hadn't gotten the noir design pass. Styled it to match the note detail page (`notes/[slug]`) and the rest of the site's visual language, and reused `LivePulse` (`notes/11`) here instead of inventing a second "time since last push" treatment.

```
frontend/app/projects/[slug]/page.tsx
```

## Reusing LivePulse instead of duplicating it

The dossier grid's `LivePulse` component (GitHub's real `pushed_at`, an animated dot, cursor-proximity color tint) was already exported from `DossierItem.tsx` for the homepage/list views. The detail page imports and reuses it directly rather than writing a second "relative time + dot" treatment — same data, same component, one place to change if the look needs to change later.

## Tech stack as chips, not a plain comma-separated line

The original version was `<p>Tech: {project.tech_stack.join(', ')}</p>` — one plain sentence. Replaced with individual rounded-pill chips (same shape as a note's category label elsewhere on the site), which reads faster at a glance and matches how tags/metadata are shown everywhere else on the site rather than introducing a new pattern just for this page.

## "Too empty" feedback, and a real-data fix instead of decoration

Right after styling, real feedback: on a project with a short description and no image, the page was mostly black empty space below the fold. The fix wasn't adding filler or a decorative element — it was a `← All Projects` back-link (basic navigation structure that was simply missing) plus a **Related Notes** section that surfaces any note whose `project_id` points at this project, reusing a relationship that already existed in the schema (`notes/07`) but had never been rendered anywhere.

```ts
const allNotes = await getNotes();
const relatedNotes = allNotes.filter((note) => note.project_id === project.id);
```

## A second, more important gap this exposed: `NoteForm` never had a Project field

Testing the new section surfaced that `project_id` was unreachable from the UI entirely — the backend (`createNote`/`updateNote`) accepted `projectId` from day one, but `NoteForm.tsx` never rendered a field for it, so no note could ever actually get linked to a project through the admin panel. Added a "Project (optional)" `<select>` populated from `GET /admin/projects`, wired into both create and edit. Without this, the Related Notes section I'd just built would have stayed permanently empty — a reminder that a new read-side feature is only real once the corresponding write path exists too.

## Verified live

- `/projects/code-review-agent`: Live Pulse ("5d ago"), Fraunces headline, description, a single `PYTHON` chip, and a "View source on GitHub →" link in the site's standard ice-hover style.
- `/projects/ledgerlite`: same layout with both GitHub and Live Demo links rendering side by side (the page already had logic for both; just needed the styling).
- `/projects/langchain-practice`: created a disposable published test note with `project_id` pointing at it — confirmed the Related Notes section renders with the note's title and category color, then deleted the test note and confirmed the section disappears again when empty.
- Admin note form: the new Project dropdown lists all 36 projects by title; selecting one and creating a note persisted the correct `project_id` in Postgres; reopening that note's edit page correctly pre-selected the same project.

## One-line interview answer

> "Found the one public page that had been skipped in the design pass — a project's detail page was still plain HTML from before the design system existed — and fixed it by reusing an existing component (the Live Pulse indicator) instead of writing a second version of the same 'time since last push' logic."
