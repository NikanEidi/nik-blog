# Gemini image prompt — langchain-practice cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a teal/cyan glow (#2dd9c4) — used sparingly, never dominating the frame.

Subject: an abstract visualization of a chain of connected nodes, representing a sequence of reasoning steps that branches outward into a single highlighted node reaching toward a small external tool icon (a plain geometric shape, not a literal robot or circuit board) — suggesting an AI agent deciding to call an external tool partway through a chain of thought. Thin, precise lines connect the nodes, like a hand-drawn technical diagram rather than a glossy 3D render.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an editorial magazine diagram or a blueprint sketch than a glossy tech-company illustration. Deliberately asymmetric composition, generous negative space, the glowing node positioned off-center. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: humanoid robots, circuit-board patterns, glowing brains, generic "AI" clichés, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `langchain-practice` project page (`/projects/langchain-practice`) — "Hands-on LangChain practice, from a plain model call to a real tool-calling agent."
- Teal (`#2dd9c4`) is the `ai-ml` accent used elsewhere on the site (`lib/categoryColors.ts`), kept consistent so the cover doesn't introduce a new color.
- Once generated, upload it through the Project edit form's Image field (`/admin/projects/22/edit`) — it uploads straight to S3 and sets `image_url`.
