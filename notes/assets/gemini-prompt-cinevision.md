# Gemini image prompt — CineVision cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: a loose vertical row of thin rectangular frames, like a film strip unspooled and scattered rather than a perfect uniform grid — each frame a different height, deliberately uneven spacing between them. Most frames are plain outlines. One frame near the center is filled with the copper accent, with a few thin lines radiating outward from its corner to two smaller, fainter frames elsewhere in the composition — a quiet nod to a recommendation engine linking one watched title to others, not a literal "related items" UI. No frame contains any image, icon, or play-button glyph inside it — just the outline and, for the highlighted one, a flat copper fill.

Style: flat, high-contrast, geometric linework on a near-black background — closer to a storyboard or a technical layout sheet than a glossy streaming-app poster. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: play-button icons, clapperboard icons, popcorn, literal movie posters or stars, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for `CineVision` — a full-stack movie & TV tracker: Supabase auth + watchlist, a Flask/scikit-learn recommendation engine (TF-IDF + cosine similarity over a TMDB-seeded catalog), and a Liquid-Glass design system.
- The scattered-frames-with-one-highlighted-and-connected motif is a quiet nod to the recommendation engine (one watched title linking to similar ones), without any literal streaming-app iconography.
- Same noir+copper-only language as the other project cover prompts (`gemini-prompt-ledgerlite.md`, `gemini-prompt-nik-blog.md`, `gemini-prompt-fragments.md`).
- Once generated, upload it through the Project edit form's Image field in the admin panel for the `cinevision` project entry — it uploads straight to S3 and sets `image_url`.
