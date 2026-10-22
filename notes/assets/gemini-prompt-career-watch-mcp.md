# Gemini image prompt — career-watch-mcp cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: two distinct geometric zones separated by an intentional boundary — representing the privacy-by-separation architecture between an autonomous searching agent and protected candidate data. On one side, an open, unconstrained field containing a loose, sparse scattering of faint, tiny rectangular outline tags (representing external job listings being scanned), with a thin directional ray traversing across them. Dividing the composition is a clean vertical boundary line interrupted only by a single narrow, gated aperture. On the protected side sits an isolated, serene rectangular enclosure (the private vault) resting in generous negative space. Inside this enclosure sits a single solid node illuminated in the warm copper accent. One thin copper vector line extends from a single matched tag in the open field, passes cleanly through the gated aperture, and terminates at the threshold of the inner enclosure — suggesting an agent delivering vetted matches inward without ever entering or touching the protected profile.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural diagram or a technical blueprint sketch than a glossy tech-company illustration. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: briefcase icons, resume/CV sheets, tie or corporate silhouette clipart, magnifying glasses, literal fortress/wall graphics, padlocks, keys, generic "hiring" clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `career-watch-mcp` project — a real MCP (Model Context Protocol) server that lets an AI agent search for jobs on my behalf without ever touching the data itself.
- The two-zone composition with a single gated aperture directly mirrors the project's core privacy-by-separation design: the agent operates in the public job space, delivering filtered findings across a boundary, while candidate profile data remains isolated inside its own enclosure.
- Same noir+copper-only language and structure as every other project cover prompt in this folder.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
