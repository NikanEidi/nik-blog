# 11: Dossier grid, Live Pulse, and a reusable proximity-tint system

## What this does

The homepage's preview sections were rebuilt three times in one session based on real feedback each round: first a plain hairline list (too plain), then an asymmetric grid with decorative ghost numbers (felt generic — "other sites have this too"), and finally the version that shipped: an asymmetric grid where the one piece of "decoration" per project is **real data** (GitHub's actual last-push time), plus a cursor-proximity reactivity system generalized into a reusable hook and applied across the whole page — not just one headline.

```
backend/services/githubService.js       — now captures repo.pushed_at
backend/services/projectService.js      — github_pushed_at persisted through all 3 upsert paths
backend/db/schema.sql                   — projects.pinned, projects.github_pushed_at, notes.pinned

frontend/lib/useProximityTint.ts        — the reusable cursor-proximity hook
frontend/lib/categoryColors.ts          — note-category → color map (hex, not CSS var)
frontend/lib/relativeTime.ts            — "5d ago" formatting for Live Pulse
frontend/components/ReactiveText.tsx    — proximity-reactive text (color + background)
frontend/components/DossierItem.tsx     — the grid item (border, background, Live Pulse)
frontend/components/GlitchText.tsx      — refactored to use the shared hook instead of its own copy
frontend/app/page.tsx                   — homepage, wires all of the above together
```

## Replacing decoration with real data: Live Pulse

The first grid version put a large faint `01`/`02`/`03` behind each title — purely decorative, and immediately recognized as a pattern plenty of other sites already use. The fix wasn't a different decoration, it was asking what *real* data was already available: `sync-github.js` already fetches each repo from the GitHub API, and the API response includes `pushed_at` — the actual timestamp of the last commit pushed to that repo. That field just wasn't being stored.

```js
// githubService.js
github_pushed_at: repo.pushed_at,
```

Stored through all three paths in `projectService.upsertFromGithub` (matched-by-URL update, adopted-by-slug update, and fresh insert) so it stays current on every re-sync, then rendered as a small animated dot plus `relativeTime(pushedAt)` ("5d ago", "3mo ago"). This is one of the four differentiators agreed back at the start of the project (`PLAN.md` §8, "Live Pulse") — finally built, and it only happened because the "soulless" decorative-number feedback forced a rethink of what a project card's corner should actually contain.

## `pinned` — my own curation signal, not just recency

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
```

Both `listPublishedProjects` and `listPublishedNotes` now order by `pinned DESC, created_at DESC` — Postgres sorts booleans `false < true`, so `DESC` puts pinned rows first, true ties broken by recency. A matching `PATCH /admin/{projects,notes}/:id/pin` endpoint and a dashboard button let this be toggled without resending the whole record — same focused-update pattern as the existing status toggle.

## The proximity-tint system — generalized, not copy-pasted per component

The homepage headline already had a cursor-proximity color tint (`notes/10`). The brief was to extend that same reactive feeling across the whole page — body text, section headings, grid borders, even the Live Pulse dot — which made a one-off `useEffect` per component the wrong shape. `lib/useProximityTint.ts` extracts the pattern into a hook:

```ts
export function useProximityTint<T extends HTMLElement>(
  radius: number,
  apply: (el: T, t: number) => void
): RefObject<T | null> {
  // one mousemove listener, one distance calculation, callers decide what `t` (0–1) does
}
```

`ReactiveText`, `DossierItem`, and `GlitchText` all use this same hook now with different `apply` functions (`textTint`, `borderTint`, `backgroundTint`, or a `combineTints(...)` of several) — the distance math and listener wiring exists in exactly one place instead of three near-duplicate copies.

## A real bug: distance-from-center breaks on large elements

The first version measured distance from the cursor to the element's **center point**. For a small headline that's fine; for a multi-line paragraph or a wide grid cell, it meant the cursor had to be almost exactly in the middle before any reaction started — reported back as "I have to hover almost exactly on the text." Fixed by measuring distance to the **nearest point on the element's bounding box** instead:

```ts
const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
const distance = Math.hypot(dx, dy);
```

`Math.max(rect.left - x, 0, x - rect.right)` is 0 whenever the cursor's x-coordinate is already between the box's left and right edges, and only grows once the cursor is actually outside that range — same idea for y. The result: `distance` is exactly 0 the instant the cursor is anywhere inside the element, not just at its center, and grows naturally outward from the nearest edge otherwise. This is the standard point-to-rectangle distance formula, and it's the detail that made the effect feel "the glow reaches it" instead of "I have to aim at the middle."

## Two signals at once: text color *and* background wash

```ts
export function backgroundTint(maxAlpha = 0.09) {
  return (el: HTMLElement, t: number) => {
    el.style.backgroundColor = `rgba(255, 255, 255, ${(t * maxAlpha).toFixed(3)})`;
  };
}
```

Feedback was that color-only felt too subtle — "the section should go white," not just the letters. `combineTints(textTint(...), backgroundTint())` runs both functions on the same element from one listener, so text brightens and a soft white wash (capped under 10% opacity, so it reads as a highlight, not a flash) grows in behind it at the same time.

## `:hover` kept separate from ambient proximity, color tried both ways

Actual clickable links still use plain CSS `:hover`, deliberately kept distinct from the passive proximity glow: a real interactive affordance needs to look different from ambient atmosphere, or the two blur together into "everything just reacts to the mouse" with no sense of what's actually clickable. The background-highlight (`hover:bg-white/5`) is what actually carries that distinction.

The hover *color* itself was changed from ice to copper mid-session, then reverted back to ice the same day — copper didn't read as clearly correct once seen live, and ice (already the ambient-glow color) turned out to be the simpler, more consistent choice. Final state across every page:

```
hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice
```

## Category color swap — a direct response to "the orange looks wrong here"

```ts
backend: '#8ec5de', // blue — swapped from the original copper/orange pick
infrastructure: '#b5703f', // copper now lives here instead
```

No technical reason — just didn't look right once seen live against real content. Logged in `DESIGN.md`'s category table with the date, same as every other color decision in this project, so a future "wait, why is backend blue?" has an answer.

## Honesty check caught in the same pass

The original hero copy said *"I update what I'm learning here daily."* That's not a commitment I actually intend to keep, and CLAUDE.md's honesty rule applies to a personal site's own copy just as much as a résumé bullet — changed to *"I write about what I'm actually learning as I build,"* which is true regardless of posting cadence. Also dropped the specific city (Newmarket, Ontario) from the public bio in favor of just "Canada," my own call for this public-facing page.

## Verified live

- `/` shows real `github_pushed_at` values ("5d ago", "3mo ago", "7d ago") pulled from an actual `sync-github.js` run, not placeholder text.
- Hovering/approaching the hero paragraph, section headings, and grid items all show both the text-color shift and the background wash, starting well before the cursor is directly on top of them.
- Links across `/`, `/projects`, `/notes`, and note detail pages all got the new background highlight on hover; the hover color itself was tested as copper, then reverted to ice the same session.

## One-line interview answer

> "Decorative placeholder numbers got replaced with real data already sitting in the database — GitHub's actual last-push timestamp — and the cursor-reactivity effect was generalized from one-off component code into a single reusable hook, fixing a real point-to-rectangle distance bug along the way: measuring from an element's center instead of its nearest edge meant large elements barely reacted at all."
