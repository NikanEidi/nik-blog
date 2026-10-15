# 17: Mermaid diagrams and real syntax highlighting in notes

## What this does

My existing `.md` notes (`langchain-practice/notes/`, etc.) already use Mermaid diagrams, and GitHub renders them natively — this site didn't, and fenced code blocks had zero syntax highlighting (every token was the same flat color). Both fixed in `notes/[slug]/page.tsx`.

```
frontend/components/MermaidDiagram.tsx   — new, renders a mermaid code block as an actual diagram
frontend/app/notes/[slug]/page.tsx       — rehype-highlight plugin, mermaid interception at the <pre> level
frontend/app/globals.css                 — hand-mapped hljs theme matching the noir tokens
```

Installed `rehype-highlight` and `mermaid`. Both are real runtime dependencies (render actual note content), not dev tooling — checked `npm audit` after installing: the reported high-severity issues are the project's existing, already-logged `eslint-config-next`/`braces` dev-toolchain vulnerability (`notes/00`), unrelated to either new package.

## Syntax highlighting via a rehype plugin, not a client library

```tsx
<ReactMarkdown components={markdownComponents} rehypePlugins={[rehypeHighlight]}>
```

`rehype-highlight` runs during the markdown→HTML AST transform (via `lowlight`), so it works entirely server-side — a code block arrives already tokenized into spans with `hljs-*` classes, no client JS needed just to show colored code. The color mapping itself is hand-written in `globals.css` against the site's own accent tokens (keywords → copper, strings → ice, function names → neon, comments → muted italic) instead of importing a stock highlight.js theme file, so a code block reads as part of the site's own design system instead of an embedded third-party widget with unrelated colors.

## Mermaid needs the DOM, so it has to be a Client Component — but only that one block

Mermaid builds an SVG via its own layout engine at render time; it can't run during server rendering. `MermaidDiagram.tsx` is `'use client'` and lazy-imports `mermaid` inside a `useEffect`, so the rest of a note (headings, prose, every other code block) stays a plain Server Component — only a note that actually contains a mermaid block pays for that extra client JS.

```tsx
mermaid.render(`mermaid-${id}`, chart).then(({ svg }) => {
  containerRef.current.innerHTML = svg;
});
```

Mermaid's own theme variables are set to the noir palette (`#0a0a0a` background, `#f2f0ec` text, `#8ec5de` borders) so a diagram doesn't show up as a bright blue box against the dark page — mermaid's default theme is tuned for a white background and looks jarring unmodified here.

## Intercepting at `<pre>`, not `<code>`

A fenced ` ```mermaid ` block arrives from `react-markdown` as `<pre><code class="language-mermaid">...</code></pre>` — detection happens in the `pre` component override, not `code`, because `code`'s output is always wrapped by its parent `pre`; checking at the `pre` level is the only point where the component can choose to render something other than a `<pre>` tag entirely:

```tsx
pre: (props) => {
  const child = props.children; // the <code> element
  if (isValidElement(child) && child.props.className?.includes('language-mermaid')) {
    return <MermaidDiagram chart={String(child.props.children).trim()} />;
  }
  return <pre className="...">{props.children}</pre>;
}
```

Every other language falls through to the normal highlighted `<pre>` unchanged.

## Verified live

- A real note (`01: First model call`) with an existing ` ```python ` block: keywords, strings, and the `ChatOllama` call all render in distinct colors matching the site's accents — confirmed via screenshot, not just "no console error."
- A disposable test note with a ` ```mermaid ` flowchart (`graph LR`, a decision node, two branches): rendered as an actual SVG diagram — boxes, a diamond, labeled arrows — not a raw code block. Deleted the test note after confirming.

## One-line interview answer

> "Diagram rendering needs the DOM (mermaid builds its own SVG layout at render time), but syntax highlighting doesn't — so only the mermaid block became a Client Component while code highlighting stayed a server-side rehype transform, keeping a plain note page's JS payload at zero for the common case."
