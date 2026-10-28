# Gemini image prompt — finetune-practice cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract visualization of Low-Rank Adaptation (LoRA) fine-tuning on a frozen neural network. A large, formidable geometric matrix block rendered in thin off-white linework sits anchor-like on one side, its internal grid entirely dormant and frozen. Running precisely alongside it is a slender, lightweight secondary bypass bracket composed of two narrow bottlenecked matrix bars (representing the low-rank A and B adapter matrices). Exactly seven delicate, precise vector pins connect this slender adapter directly into key injection points along the edge of the large frozen block (representing the seven target projection layers). The slender adapter bar and the connecting injection pins glow in the warm copper accent, illustrating a featherweight adapter transforming the output while the massive underlying model remains completely untouched. A subtle, austere progression of three small step tick-marks sits quietly below the bracket, a quiet nod to the three-attempt tuning journey.

Style: flat, high-contrast, geometric linework on a near-black background — closer to a hardware architecture schematic or an austere linear algebra diagram than a glossy AI illustration. Deliberately asymmetric composition, generous negative space, the structures positioned off-center. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: humanoid robots, glowing cyborg brains, neural network web meshes, colorful gradient waves, Apple logos, chips or processor clipart, line charts with arrows, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `finetune-practice` project — hands-on LoRA fine-tuning from zero on Apple Silicon (MPS): a 500M parameter base model frozen, trained with a lightweight adapter across all 7 projection layers after a real 3-attempt debugging journey.
- The visual metaphor directly reflects the core mechanism of LoRA: a large dormant/frozen base block coupled with a slender copper low-rank bypass adapter linked via 7 distinct injection points (the 7 target projection layers that unlocked convergence).
- Three subtle step ticks quietly reference the 3-attempt tuning journey documented in note 05.
- Same noir+copper-only language and structure as every other project cover prompt in this folder.
- Once generated, upload it through `upload_project_image(45, ...)`.
