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

The site had zero footer — no way to reach my GitHub, LinkedIn, or email from any page. Added `Footer.tsx`, mounted once in the root layout so every page gets it via `mt-auto` on a flex-column `<body>` (pins to the bottom on short pages, flows naturally after content on long ones).

**Real bug, and a two-step fix — the first attempt wasn't actually enough.** `new Date().getFullYear()` in the Footer tripped Next.js 16's Cache Components prerendering check — "Next.js encountered the unstable value `new Date()` while prerendering." First fix was marking `Footer` as a Client Component, same as `CursorGlow` already does for its own dynamic behavior — and that *did* clear the error in testing at the time. But a Client Component still gets server-rendered for its first paint, which still counts as "prerendering" to this check, and the error came back once a fresh prerender actually ran (caught from the real browser, not the dev session that happened to avoid triggering it). The actual fix: stop calling `new Date()` during render at all. Compute the year only after mount:

```tsx
const [year, setYear] = useState<number | null>(null);
useEffect(() => {
  setYear(new Date().getFullYear());
}, []);
// ...
<p>© {year ?? ''} Nikan Eidi</p>
```

`'use client'` was necessary but not sufficient — the component also had to stop reading a dynamic value during its own render path, client or not.

## Verified live

- Homepage and `/projects/[slug]`: card borders and tags render copper everywhere; hovering a dossier card no longer shows any background wash or border-color shift — only the title link itself turns ice on direct hover.
- `/projects/code-review-agent`: the `PYTHON` tech chip renders copper-bordered/copper-text, matching the tag color everywhere else.
- Footer renders on every page checked (`/`, a project detail page), links point to the real GitHub/LinkedIn/email, and the year populates correctly after mount (`© 2026 Nikan Eidi`).
- Confirmed the Next.js dev-overlay error badge is actually gone after the `useEffect` fix — the earlier `'use client'`-only fix had looked sufficient in testing but the error reappeared on a real fresh load, which is what prompted the second, correct fix.

## One-line interview answer

> "A styling request surfaced a real Next.js 16 Cache Components error, and the first fix for it looked right but wasn't — marking the component a Client Component cleared the error in that session, but a Client Component still gets server-rendered for its first paint, so the actual fix was moving the `new Date()` call out of render entirely and into a `useEffect`, which is the only place a dynamic value is safe to read regardless of client/server."
