# Gemini image prompt — data_structure_visualizer cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract row of simple geometric nodes (small squares and circles mixed, representing an array/linked structure) connected by thin lines, with one node in the middle highlighted in the copper accent — as if a step-by-step algorithm is paused mid-execution on that element. Below the row, a minimal horizontal timeline/scrubber line with a small playhead marker (a simple triangle or dash, not a literal video-player icon) suggests step-through playback controls. Deliberately sparse — a handful of nodes, not a dense diagram.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an algorithm textbook's own austere diagrams or a technical blueprint than a glossy developer-tool screenshot. Deliberately asymmetric composition, generous negative space, the node row positioned off-center. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: literal play/pause button icons, video-player chrome, bar charts, colorful data-viz palettes, gradients, drop shadows, 3D rendering, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `data_structure_visualizer` project — an interactive Streamlit app that visualizes algorithm execution step by step, with editable inputs, autoplay controls, and PDF/GIF/MP4 export.
- The highlighted node + timeline scrubber are a visual nod to "paused mid-step, playback controls" without using literal video-player iconography.
- Same noir+copper-only language as every other project cover prompt in this folder.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
