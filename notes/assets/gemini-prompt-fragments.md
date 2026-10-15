# Gemini image prompt — fragments cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract composition of a few broken, irregular geometric fragments (angular shards, not smooth rounded shapes) scattered with deliberate asymmetry, each fragment connected to the others by thin precise lines — like a cracked object being reassembled through a network rather than a shattered image. One fragment near the center glows faintly with the copper accent, as if actively being written or transformed, while the rest remain plain off-white outlines. A few small square nodes along the connecting lines suggest storage/processing points without being literal server or database icons.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural diagram or a technical blueprint sketch than a glossy tech-company illustration. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: literal cloud icons, server racks, gears, padlocks, generic "cloud computing" clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `fragments` project — a cloud-native microservice for storing and transforming user data fragments (Node.js/Express, AWS S3/DynamoDB/Cognito/EC2/ECR, Docker, CI/CD via GitHub Actions).
- Same noir+copper-only language as the other project cover prompts (`gemini-prompt-langchain-practice.md`, `gemini-prompt-hc.md`), per the 2026-10-15 decision to keep the whole site to one accent color.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
