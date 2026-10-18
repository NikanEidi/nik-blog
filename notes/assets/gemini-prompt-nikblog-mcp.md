# Gemini image prompt — nikblog-mcp cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: one small rounded-rectangle node near the center, representing a server, with three thin straight lines radiating outward at different angles to three distinct small outline shapes near the edges of the frame — each shape a different simple silhouette (a rounded square, a hexagon, a narrow vertical bar), representing different, unrelated clients connecting to the same server, never drawn as recognizable logos or icons. One of the three connector lines is rendered in the copper accent, as if actively in use; the other two stay plain outlines. Below the central node, a short row of three tiny outlined tiles sits half-overlapping it, each barely large enough to read as a distinct unit — a quiet nod to callable tools, not labeled, not decorated.

Style: flat, high-contrast, geometric linework on a near-black background — closer to a network topology diagram or a technical schematic than a glossy "AI integration" marketing graphic. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: plug/cable icons, USB icons, robot or chip icons, literal brand logos of any AI tool or company, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for `nikblog-mcp` — a real MCP (Model Context Protocol) server exposing nik-blog's live API as callable tools, reachable by any MCP-compatible client (Claude Code, Claude Desktop, Cursor, etc.), deployed on Render as a streamable-HTTP service.
- The one server node with multiple distinct client shapes connecting to it is a quiet, literal nod to the actual point of MCP — one server, many different clients, no custom glue code per pairing — without using a USB-C icon or any literal connector/plug imagery.
- Same noir+copper-only language as the other project cover prompts (`gemini-prompt-nik-blog.md`, `gemini-prompt-leet-journal.md`, `gemini-prompt-ledgerlite.md`).
- Once generated, upload it through the Project edit form's Image field in the admin panel — create a `nikblog-mcp` project entry first if one doesn't exist yet, linking to `https://github.com/NikanEidi/nikblog-mcp`.
