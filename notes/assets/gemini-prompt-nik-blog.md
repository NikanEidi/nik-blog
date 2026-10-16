# Gemini image prompt — nik-blog cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: three thin horizontal plates stacked with deliberate, uneven gaps between them (not a uniform, centered stack) — representing distinct architectural layers talking to each other, not one solid block. The bottom plate is the widest and plainest (a foundation/data layer). The middle plate is slightly offset to one side, with a few thin vertical connector lines running up from the bottom plate through it, like a REST API passing data upward. The top plate is the smallest, tilted at a faint angle, with a single small open-book/journal outline resting on its corner — a few short horizontal strokes suggesting written lines, not legible text. One connector line between the middle and top plates ends in a small solid dot pulsing with the copper accent — a quiet nod to a live status indicator, not a loud glow.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural blueprint or an exploded-view technical diagram than a glossy app-landing-page illustration. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: literal laptop/browser-window mockups, generic "blog" or "website" clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for `nik-blog` itself — the portfolio/blog project this very site is: a REST API (bottom layer), a public Next.js site + admin panel (middle layer), and the notes/journal content it publishes (top layer, the open-book motif).
- The pulsing copper dot between the middle and top layers is a quiet reference to the site's real `LivePulse` component (shows real time-since-last-commit from the GitHub API) — not decorative, tied to an actual feature.
- Same noir+copper-only language as the other project cover prompts (`gemini-prompt-ledgerlite.md`, `gemini-prompt-langchain-practice.md`, `gemini-prompt-hc.md`, `gemini-prompt-fragments.md`).
- Once generated, upload it through the Project edit form's Image field in the admin panel for the `nik-blog` project entry — it uploads straight to S3 and sets `image_url`.
