# 10: Glitch text + cursor-proximity tint — two real CSS debugging sessions

## What this does

The `/projects` headline now has two reactive effects layered on one `GlitchText` component: a brief chromatic-aberration "glitch" flicker on a timer, and a continuous color tint toward icy blue as the cursor glow (`CursorGlow.tsx`, `notes/09`) gets physically closer to it.

```
frontend/components/GlitchText.tsx   — both effects
frontend/app/globals.css             — .glitch-active + @keyframes glitch-shadow
```

Both bugs below cost real debugging time and are worth remembering, because neither produced a JavaScript error — the symptom in both cases was just "nothing visibly happens."

## Bug 1: a CSS rule that looked fine but never loaded (stale dev-server cache)

The first version of the glitch class toggled correctly (confirmed via DevTools — `glitch-active` really was being added and removed on the element), but no visual effect ever appeared. The fix wasn't in the code.

**How it was actually diagnosed:** instead of guessing, ran this in the browser console to check whether the CSS rule existed in any loaded stylesheet at all:

```js
[...document.styleSheets]
  .flatMap(s => { try { return [...s.cssRules] } catch(e) { return [] } })
  .filter(r => r.cssText?.includes('glitch-active'))
```

Empty array — the rule flat-out wasn't in the compiled CSS the browser had, even though the file on disk had it. Narrowing further (checking whether a rule written *before* it in the same file was present) showed everything up to a certain point loaded fine, everything after didn't — a signature of Turbopack serving a stale compiled bundle rather than a syntax problem. Fixed by fully restarting `npm run dev` (not just a browser refresh) and hard-refreshing.

**Lesson:** when a CSS class is confirmed to be toggling (DevTools shows the class on the element) but still produces zero visual change, check whether the rule is in the stylesheet at all before assuming the component logic is wrong. A hot-reloaded dev server can silently serve CSS that's behind what's on disk.

## Bug 2: Lightning CSS silently dropping a rule it didn't like

After the cache issue, a second effect (proximity-based color tinting) was added using `color-mix()`:

```css
/* This rule never loaded — not a cache problem this time */
.glitch-proximity {
  color: color-mix(in oklch, var(--color-noir-text), var(--color-accent-ice) calc(var(--proximity, 0) * 100%));
}
```

Same symptom, same diagnostic console query — still an empty array, even after a full restart. But this time, checking a rule written *after* this one in the file (`glitch-shadow`, the keyframes) came back present. That ruled out a stale-cache or cascading-parse-failure explanation: only this one specific rule was missing, nothing around it.

**Root cause:** Tailwind v4's CSS engine (Lightning CSS, written in Rust) parsed the rest of the file fine but silently rejected this one declaration — most likely the `calc()` expression inside the `color-mix()` percentage argument isn't something its parser accepts, even though it's valid in the CSS spec and works in a real browser's own engine. Lightning CSS drops a rule it can't parse rather than erroring the whole build, which is exactly why there was no build error or console warning to point at the real cause.

**The fix: do the color blend in JavaScript instead of CSS.** The proximity value was already being computed in JS on every `mousemove` anyway (see below) — rather than exporting that number to CSS via a custom property and hoping `color-mix()` handles it, the two colors are interpolated directly in JS and written straight to `element.style.color`:

```js
const BASE = { r: 0xf2, g: 0xf0, b: 0xec }; // --color-noir-text
const TINT = { r: 0x8e, g: 0xc5, b: 0xde }; // --color-accent-ice

const r = Math.round(BASE.r + (TINT.r - BASE.r) * t);
const g = Math.round(BASE.g + (TINT.g - BASE.g) * t);
const b = Math.round(BASE.b + (TINT.b - BASE.b) * t);
el.style.color = `rgb(${r}, ${g}, ${b})`;
```

**Lesson:** a CSS build tool's parser is not guaranteed to accept every construct that's valid in browsers, and it may fail silently (drop the rule) instead of erroring. When a specific modern CSS function stops working for no visible reason, the console-query technique above (check whether the rule is even in the compiled stylesheet) separates "my JS logic is wrong" from "the CSS never made it into the bundle" in about ten seconds — much faster than re-reading the component code repeatedly.

## Distance-based proximity, not `:hover`

```js
const rect = el.getBoundingClientRect();
const cx = rect.left + rect.width / 2;
const cy = rect.top + rect.height / 2;
const distance = Math.hypot(e.clientX - cx, e.clientY - cy);
const t = Math.max(0, 1 - distance / PROXIMITY_RADIUS);
```

A plain `:hover` only fires once the cursor is exactly over the element — a hard on/off switch. Computing the actual Euclidean distance from the cursor to the element's center (`Math.hypot`, the straight-line distance formula) and mapping it to a 0–1 value instead produces a *continuous* reaction: the text starts tinting as the glow approaches, well before the cursor is directly on top of it, matching how the glow itself already looks (a soft radius, not a hard edge).

## A periodic glitch, not a continuous one

```js
const interval = setInterval(() => {
  setGlitching(true);
  timeoutRef.current = setTimeout(() => setGlitching(false), durationMs);
}, intervalMs);
```

Fires a short burst every `intervalMs` instead of animating forever — a glitch effect that never stops reads as a rendering bug, not a stylistic choice. One real gotcha here: the CSS `animation-duration` (`0.75s` in `glitch-shadow`) and the component's `durationMs` prop (how long the `glitch-active` class stays applied) have to be kept in sync by hand — if the class is removed before the CSS animation finishes, nothing breaks, but if the class stays on *after* the animation finishes, the element just sits at its last keyframe (no shadow) for the remainder, which looks like "nothing is happening" even though the class is correctly active. This was the original Bug 1 report before the cache issue was found underneath it.

## Verified live

- Confirmed via the console query that `.glitch-active` and `@keyframes glitch-shadow` are present in the loaded stylesheet after the dev-server restart.
- Watched the glitch fire every 5 seconds with the colored double text-shadow and slight blur/opacity flicker.
- Moved the cursor toward and away from the headline and watched the text color continuously shift between off-white and icy blue, confirming the JS-based interpolation replaced the dropped `color-mix()` rule correctly.

## One-line interview answer

> "Two separate bugs here looked like JavaScript problems but were actually CSS delivery problems — one was a stale Turbopack-compiled stylesheet after a hot reload, the other was Lightning CSS silently dropping a `color-mix()` rule it couldn't parse. Querying `document.styleSheets` directly in the console to check whether a rule actually made it into the compiled CSS is a fast way to separate 'my logic is wrong' from 'my CSS never shipped' — and when a CSS build tool won't cooperate with a specific value, computing it in JavaScript and writing it straight to `element.style` sidesteps the build tool's parser entirely."
