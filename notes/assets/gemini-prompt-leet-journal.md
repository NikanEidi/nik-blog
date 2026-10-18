# Gemini image prompt — leet-journal cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: a loose, irregular grid of small square outline tiles — like index cards scattered on a dark table, each one slightly rotated, never perfectly aligned — representing individual solved problems. A thin rectangular frame (an open bracket shape, like a viewfinder or a sliding window) overlaps a short row of three adjacent tiles, drawn in the copper accent, as if actively scanning across them — a quiet, literal nod to the sliding-window technique. One tile fully inside that frame is filled solid copper; the rest stay plain outlines. A few faint thin lines connect two or three other tiles elsewhere in the grid, like a quiet nod to a hashmap linking related entries, without looking like a flowchart.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an index-card wall or a technical annotation sheet than a gamified "leaderboard" or trophy-style coding-practice graphic. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: trophy or medal icons, checkmarks, progress bars, flame/streak icons, literal code syntax or brackets as text, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for `leet-journal` — real DSA/LeetCode practice in Python, documented as an actual journey (bugs and all), not polished final solutions.
- The sliding-window frame scanning across a row of tiles is a literal, specific reference to the pattern practiced most recently (Longest Substring Without Repeating Characters), not generic "coding practice" iconography.
- Same noir+copper-only language as the other project cover prompts (`gemini-prompt-nik-blog.md`, `gemini-prompt-ledgerlite.md`, `gemini-prompt-cinevision.md`).
- Once generated, upload it through the Project edit form's Image field in the admin panel — create a `leet-journal` project entry first if one doesn't exist yet, linking to `https://github.com/NikanEidi/leet-journal`.
