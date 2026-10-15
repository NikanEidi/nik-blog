# 16: Tag colors simplified to one accent, proximity glass effect dropped, site footer added

## What this does

Three small, related fixes from direct feedback after seeing the dossier grid and tag colors against real content for a while: the per-category rainbow and the proximity "glass" hover effect both read as too much going on at once, and the site had no footer at all — no GitHub link anywhere.

```
frontend/lib/categoryColors.ts     — categoryColor() now returns one fixed color
frontend/components/DossierItem.tsx — proximity border/background tint removed
frontend/app/projects/[slug]/page.tsx — tech-stack chips recolored to match
frontend/components/Footer.tsx     — new
frontend/app/layout.tsx            — mounts Footer globally
```

## One tag color instead of five

`categoryColor()` used to map each category to a different accent (`ai-ml` neon, `backend` ice, `infrastructure` copper, `ios` violet, `dsa` coral). With several categories visible on screen together (the homepage's Notes preview, the grouped `/notes` list from `notes/15`), that turned into a lot of different colors competing for attention — direct feedback that it looked jarring, not intentional. Simplified to a single constant:

```ts
export function categoryColor(_category: string): string {
  return TAG_ACCENT_COLOR; // copper, '#b5703f'
}
```

Keeping the function's signature unchanged meant every call site (`DossierItem`'s accent prop, the `/notes` section headers, the Related Notes labels, `app/page.tsx`'s note meta) needed zero changes — only the implementation moved.

## Removing the proximity-to-white effect on grid cards

`DossierItem`'s border and background used to tint toward white as the cursor approached (`notes/11`, `notes/13`). Feedback: a project/note card's color identity (its category or pin accent) shouldn't shift at all — the effect read as a "glassy/frosted" hover state, not polish. Stripped the `useProximityTint` call from `DossierItem` and `LivePulse` entirely; both now hold a fixed color. The title link inside each card still reacts on hover — but that's plain CSS `:hover` to ice, same as every other link on the site, not the JS proximity system. The proximity system itself (`lib/useProximityTint.ts`) is untouched and still powers the homepage's body text and headings, which weren't part of this feedback.

## A footer, and the first GitHub link anywhere on the site

The site had zero footer — no way to reach Nikan's GitHub, LinkedIn, or email from any page. Added `Footer.tsx`, mounted once in the root layout so every page gets it via `mt-auto` on a flex-column `<body>` (pins to the bottom on short pages, flows naturally after content on long ones).

**Real bug caught immediately:** `new Date().getFullYear()` in a Server Component tripped Next.js 16's Cache Components prerendering check — "Next.js encountered the unstable value `new Date()` while prerendering" — the exact same category of issue `CursorGlow` already solves by being a Client Component. Fixed the same way: `'use client'` on `Footer`, confirmed the dev-overlay error badge disappeared on reload.

## Verified live

- Homepage and `/projects/[slug]`: card borders and tags render copper everywhere; hovering a dossier card no longer shows any background wash or border-color shift — only the title link itself turns ice on direct hover.
- `/projects/code-review-agent`: the `PYTHON` tech chip renders copper-bordered/copper-text, matching the tag color everywhere else.
- Footer renders on every page checked (`/`, a project detail page), links point to the real GitHub/LinkedIn/email.
- Confirmed the Next.js dev-overlay "1 Issue" badge (the `new Date()` prerendering error) is gone after converting `Footer` to a Client Component.

## One-line interview answer

> "A styling simplification request surfaced a real Next.js 16 Cache Components error — `new Date()` in a Server Component isn't prerenderable — caught immediately by the dev overlay and fixed the same way an earlier component (`CursorGlow`) had already solved the identical class of problem: moving the dynamic value into a Client Component."
