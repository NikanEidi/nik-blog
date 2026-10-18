# Gemini image prompt — terraform-practice cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: a loose grid of simple rectangular block outlines, like a blueprint or schematic — most drawn as thin, dashed or faint outlines only (unbuilt, planned), while two or three of the blocks are filled solid in off-white with one connecting line rendered in the copper accent, as if they have just been materialized from the plan into something real. A few thin straight lines connect some of the blocks to each other, like a dependency graph, kept sparse and precise, not a dense web. The overall read is "a plan becoming infrastructure," not a generic flowchart.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural blueprint or a technical schematic than a glossy cloud-tool illustration. Deliberately asymmetric composition, generous negative space, the grid positioned off-center rather than filling or centering the frame. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: the literal Terraform logo (the purple interlocking-ring/hexagon mark), any cloud-provider logos (AWS, Azure, GCP), gear icons, generic "devops" clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `terraform-practice` project — hands-on Terraform (Infrastructure as Code) exercises on real AWS infrastructure: resources/variables/outputs, least-privilege IAM-as-code, a second resource type, remote state with locking, reusable modules.
- The dashed-outline-vs-solid-filled blocks are a visual echo of Terraform's own `plan`/`apply` distinction (what's merely planned vs. what's actually been created) — the real core concept of the tool — without reproducing its trademarked logo.
- Same noir+copper-only language as every other project cover prompt in this folder.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`. Create a `terraform-practice` project entry first if one doesn't exist yet, linking to `https://github.com/NikanEidi/terraform-practice`.
