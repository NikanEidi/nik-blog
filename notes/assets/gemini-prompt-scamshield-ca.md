# Gemini image prompt — scamshield-ca cover

**Aspect ratio:** 16:9

```
A minimalist, editorial-style cover illustration for a software engineering portfolio, in a strict noir color palette: near-black background (#0a0a0a), off-white linework (#f2f0ec), with exactly one accent color — a warm copper glow (#b5703f) — used sparingly, never dominating the frame.

Subject: an abstract visualization of multi-class message classification and threat discrimination. On the left side, an irregular series of incoming horizontal signal pulses (representing incoming text messages) feeds into a sharp, angular geometric classification prism gate. Branching out from the prism are four downward-deflected trajectory lines that terminate into small, faint hatched deflection zones (representing the rejected scam categories: fake tax, postal, transfer, and account alerts). A single horizontal vector path continues cleanly straight through the gate unobstructed, terminating at a solid, circular registration node illuminated in the warm copper accent (representing a legitimate, verified message). Beside the prism gate sits a minimal vertical vernier scale with a single copper tick-mark indicating the confidence threshold.

Style: flat, high-contrast, geometric linework on a near-black background — closer to a precision spectroscopy schematic or a signal-analyzer diagram than a cybersecurity graphic. Deliberately asymmetric composition, generous negative space, positioned off-center. A very subtle film-grain texture over the whole image, almost imperceptible.

Strictly avoid: literal shield icons, Canadian flags or maple leaves, phishing hook clipart, padlock/key graphics, envelope icons with warning triangles, red exclamation marks, robot or skull clipart, gradients, drop shadows, 3D rendering, bright multi-color palettes, stock-icon style, text or lettering of any kind.

No text in the image.
```

## Notes

- Written for the `scamshield-ca` project — a text classifier that detects common Canadian scam messages (fake Interac, CRA, Canada Post, bank alerts) and scores legitimate messages, also exposed as an MCP tool.
- The visual metaphor directly reflects the core mechanism: an incoming message signal channeled through an analytical classification gate, deflecting 4 scam categories downward while passing verified legitimate signals through with high confidence.
- Same noir+copper-only language and structure as every other project cover prompt in this folder.
- Once generated, upload it through `upload_project_image(46, ...)`.
