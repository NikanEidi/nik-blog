# 15: Notes grouped by category, and a missing breadcrumb trail fixed

## What this does

Two small navigation/structure gaps, found by actually using the site after real notes started getting imported: `/notes` was one flat hairline list with a category label dangling on the right of each row (easy to miss, no real grouping), and neither `/notes` nor `/projects` had any way back to the homepage — only the detail pages (`/notes/[slug]`, `/projects/[slug]`) had a back-link, and only to their own list page, not any further.

```
frontend/app/notes/page.tsx      — grouped-by-category sections, back-link to Home
frontend/app/projects/page.tsx   — back-link to Home
```

## Grouping notes by category instead of a flat list

```ts
function groupByCategory(notes: Note[]): [string, Note[]][] {
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    const existing = groups.get(note.category);
    if (existing) existing.push(note);
    else groups.set(note.category, [note]);
  }
  return [...groups.entries()];
}
```

A `Map` preserves insertion order, and the notes array arriving from the API is already sorted (pinned first, then recency) — so grouping this way means sections land in a reasonable order with no second sort pass needed, and no risk of alphabetical sort separating notes that actually belong together by recency. Each group renders as its own `<section>` with a small colored header (`categoryColor(category)`, the same function from `notes/13`/`14`) instead of repeating the category label on every single row.

## The breadcrumb chain was only half-built

The detail pages already had `← All Projects` / implicitly linked back (via `notes/13`), but the list pages themselves were dead ends — no way back to `/` without using the browser's back button. Added a `← Home` link to both `/notes` and `/projects`, matching the same style already established on the detail pages. The full chain is now: detail page → its list page → home, at every level.

## Verified live

- `/notes`: sections render correctly — `LANGCHAIN` and `KUBERNETES` as two separate groups with their own headers, in the order notes actually appear (not re-alphabetized), `← Home` link present and styled correctly.
- `/projects`: `← Home` link renders correctly above the existing list.

## One-line interview answer

> "A flat list that happened to look grouped (because notes about the same topic were inserted consecutively) turned into actually-grouped sections using a `Map` to preserve insertion order — avoiding a second alphabetical sort pass that would've scattered notes that belonged together by recency instead."
