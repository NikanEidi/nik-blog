# 09: Noir design system — tokens, editorial layout, a cursor-reactive glow

## What this does

The site's first real visual pass: a documented design system instead of ad-hoc styling, applied to `/projects` as the first page — an editorial/magazine layout (not a card grid), a noir black/white/grayscale base with two sparing accent colors, and two lightweight atmosphere effects (a cursor-following glow, a film-grain texture).

```
frontend/app/globals.css             — Tailwind v4 @theme tokens, grain texture
frontend/app/layout.tsx              — Fraunces font, mounts CursorGlow globally
frontend/components/CursorGlow.tsx   — the mouse-following glow effect
frontend/app/projects/page.tsx       — first page restyled to the editorial layout
```

## Why the design system was documented before writing a single class

The direct trigger: frustration that "every site's UI looks the same" — the same card grids, the same icon packs, the same templated spacing. Writing the tokens and principles down *before* touching a component forces every later styling decision to trace back to a documented reason, instead of picking colors/spacing ad hoc per component (which is exactly how sites drift into looking like every other template). The record also keeps track of what was *rejected* — e.g. gold as the accent color, dropped for reading as a cliché "premium portfolio" choice, replaced with a copper/rust tone instead.

## Tailwind v4 tokens live in CSS, not a config file

```css
:root {
  --color-noir-bg: #0a0a0a;
  --color-accent-ice: #8ec5de;
  /* ... */
}

@theme inline {
  --color-noir-bg: var(--color-noir-bg);
  --color-accent-ice: var(--color-accent-ice);
  /* ... */
}
```

Tailwind v4 (this project uses `tailwindcss@^4`) reads design tokens from CSS `@theme` blocks instead of a `tailwind.config.ts` file. Defining the raw values once in `:root` and mapping them into `@theme` means the same token also works as a plain CSS variable anywhere that isn't a Tailwind class (useful for the `CursorGlow` component below, which sets a background color via inline `style`, not a class).

## A real color-contrast bug, caught by eye

The first `accent-ice` value (`#d7e6ef`) was picked to feel "icy near-white," but against the near-white body text (`#f2f0ec`) the difference was nearly invisible on hover — a real, not theoretical, accessibility/legibility problem. Fixed by darkening it to `#8ec5de` and adding a second hover cue (an underline that fades in via `decoration-transparent` → `decoration-accent-ice`), so the feedback doesn't depend on a subtle color shift alone.

## Editorial layout, not a card grid

```tsx
<ul className="mt-16 divide-y divide-noir-border">
  {projects.map((project) => (
    <li className="flex flex-col gap-2 py-8 md:flex-row md:items-baseline md:justify-between md:gap-8">
```

`divide-y divide-noir-border` draws a single hairline between list items instead of wrapping each project in its own bordered/shadowed box. `md:w-1/3 md:shrink-0` on the title keeps the title column narrower than the description, an intentionally asymmetric split rather than a centered, uniform grid — the specific thing that makes list-style portfolio pages look like a template.

## `CursorGlow` — reactive, but without re-rendering React on every mouse move

```tsx
useEffect(() => {
  function handleMove(e: MouseEvent) {
    const el = glowRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }
  window.addEventListener('mousemove', handleMove);
  return () => window.removeEventListener('mousemove', handleMove);
}, []);
```

A naive version of this would hold the cursor position in `useState` and re-render on every `mousemove` — potentially dozens of re-renders per second across the whole component tree, for a value nothing else in the UI needs to read. Writing directly to a DOM ref's `style.transform` instead skips React entirely for this update; the browser only has to recompute a cheap CSS transform, not re-run any component. This is a pattern worth remembering any time a UI needs to react to a high-frequency event (mouse move, scroll, resize) but the result only affects one element's visual style.

## Grain texture: an inline SVG filter, not an image file

```css
body::before {
  background-image: url("data:image/svg+xml;utf8,<svg ...><filter id='n'><feTurbulence .../></filter>...");
  opacity: 0.035;
}
```

`feTurbulence` is an SVG filter primitive that generates procedural noise — encoding it as a data URI means the grain texture costs zero extra network requests (no image file to fetch) and scales to any screen size without pixelation. Kept at very low opacity (`0.035`) so it reads as a subtle film-grain texture, not visible noise.

## A rejected idea: a starfield background

Considered and explicitly rejected: a twinkling starfield is one of the most overused effects in developer portfolios specifically — adding it would undercut the whole point of trying not to look like every other site. Logged here so the idea isn't silently reconsidered later without the context of why it was turned down.

## Verified live

- `/projects` renders with the Fraunces display font, noir background, and the editorial list layout.
- Hovering a project title shows both the color shift and the underline — confirmed the contrast fix actually fixed the original barely-visible-hover bug.
- The cursor glow and grain texture are both visible and don't noticeably affect scroll/interaction smoothness.

## One-line interview answer

> "The design system is documented before any component styling, with tokens defined once as CSS variables that Tailwind v4 reads via `@theme` — and the cursor-reactive glow effect writes directly to a DOM ref instead of React state, so a high-frequency event like mousemove never triggers a full component re-render."
