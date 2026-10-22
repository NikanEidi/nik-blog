# Gemini image prompt — nikblog-image-mcp cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract sequential progression of three thin rectangular frames positioned asymmetrically from left to right along a fine horizontal alignment rail — representing the end-to-end pipeline of generating, confirming, and publishing a portfolio cover image. The leftmost frame consists only of faint corner crop marks (an unformed canvas / prompt stage). Along the center of the rail sit two small, precise vertical notch gates (suggesting the two explicit confirmation checkpoints — prompt approval and upload preview). The rightmost frame is a fully realized, pristine rectangular frame outline, anchored firmly onto a minimal foundation plate, with its top corner bracket and a single delicate connecting line illuminated in the warm copper accent — representing the final image docking seamlessly into the live site's database without manual copy-pasting.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an optical alignment schematic or an architectural diagram than a glossy SaaS marketing illustration. Deliberately asymmetric composition, generous negative space, the progression positioned off-center. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: camera icons, mountain/sun landscape photo clipart, upload/download cloud icons, up-arrows, paintbrush/palette symbols, cables, plugs, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `nikblog-image-mcp` project — a real MCP (Model Context Protocol) server that closes the manual work in how I get a cover image onto Nik-Blog — from writing the Gemini prompt to the image landing live on the site.
- The three-stage progression along an alignment rail with dual confirmation notches directly mirrors the server's workflow: draft prompt -> two-step confirmation gate -> direct live API & S3 publication.
- Same noir+copper-only language and structure as every other project cover prompt in this folder.
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
