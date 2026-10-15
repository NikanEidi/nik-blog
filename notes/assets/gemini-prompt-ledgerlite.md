# Gemini image prompt — ledgerlite cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract ledger/balance sheet rendered as a few thin horizontal rows of varying length, like line items on a statement, stacked with deliberate asymmetric spacing (not a uniform grid). One row near the middle is highlighted in the copper accent — as if a single transaction is actively mid-process — with a small geometric node at its end connecting outward to a minimal, abstract shield or lock outline (a simple angular shape, not a literal padlock icon) suggesting authentication/security without being a clipart symbol. A faint secondary row branches off to a small diamond-shaped node, hinting at a state-machine decision point.

Style: flat, high-contrast, geometric linework on a near-black background — closer to an architectural diagram or an accounting ledger's own austere grid than a glossy fintech-app illustration. Deliberately asymmetric composition, generous negative space, nothing centered or symmetrical. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: literal padlock icons, dollar signs, coins, bank-building icons, generic "fintech" clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `ledgerlite` project — a digital-bank core REST API (Java 21, Spring Boot 4): idempotent transfers, row-level locking, JWT auth, and a loan state machine.
- The highlighted row + diamond node is a visual nod to the loan state machine and an in-flight idempotent transaction, without using any literal banking iconography.
- Same noir+copper-only language as the other project cover prompts (`gemini-prompt-langchain-practice.md`, `gemini-prompt-hc.md`, `gemini-prompt-fragments.md`).
- Once generated, upload it through the Project edit form's Image field in the admin panel — it uploads straight to S3 and sets `image_url`.
