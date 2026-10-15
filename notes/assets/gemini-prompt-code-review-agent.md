# Gemini image prompt — code-review-agent cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract stack of thin horizontal bars of varying length (representing lines of code, not literal text), with two or three of the bars marked by a small geometric flag or tick-mark at their edge — as if specific lines were flagged during a review. One flagged bar is highlighted in the copper accent, the most prioritized finding, with a thin line connecting it outward to a small ranked list of three short marks (suggesting findings sorted by priority). The composition reads like a technical annotation diagram, not a literal code editor screenshot.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural/technical diagram than a glossy IDE screenshot or a magnifying-glass "code review" clipart. Deliberately asymmetric composition, generous negative space, the bar stack positioned off-center. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: literal magnifying glass icons, checkmark/checklist clipart, IDE/editor window chrome, syntax-highlighted code screenshots, robot or AI-brain imagery, gradients, drop shadows, 3D rendering, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `code-review-agent` project — a LangChain tool-calling agent that reviews a Python file using real, deterministic tools (`ruff`, Python's `ast` module), then explains and prioritizes what it finds, instead of guessing.
- The flagged/highlighted bar + ranked marks are a visual nod to "finds issues, then prioritizes and explains them" without a literal magnifying-glass or checklist cliché.
- Same noir+copper-only language as every other project cover prompt in this folder.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
