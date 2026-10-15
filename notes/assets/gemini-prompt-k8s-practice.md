# Gemini image prompt — k8s-practice cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract cluster of a few hexagonal cell outlines (a nod to Kubernetes' own hexagon shape, but kept pure geometric linework — not the literal Kubernetes helm logo), connected by thin precise lines like a scaling/orchestration diagram. Two or three of the hexagons are slightly duplicated with a faint offset line, suggesting replicas scaling outward, while one hexagon near the edge is highlighted in the copper accent as the one actively being scheduled or health-checked. The composition reads like a technical architecture sketch, not a cute cluster icon.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural diagram or a blueprint sketch than a glossy devops-tool illustration. Deliberately asymmetric composition, generous negative space, the hexagon cluster positioned off-center rather than filling the frame. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: the literal Kubernetes steering-wheel/helm logo, whale icons, ship/container iconography, gears, generic "devops" clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `k8s-practice` project — hands-on Kubernetes exercises run on a local cluster (deployments, services, scaling/rolling updates, health checks, ConfigMaps/Secrets, namespaces).
- Deliberately avoids the actual Kubernetes logo/mascot imagery — the hexagon shape is a visual echo of it without directly reproducing a trademarked logo, kept abstract per the site's own style.
- Same noir+copper-only language as every other project cover prompt in this folder.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
