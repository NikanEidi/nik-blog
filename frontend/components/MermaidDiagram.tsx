'use client';

import { useEffect, useId, useRef, useState } from 'react';

// Renders a ```mermaid code block as an actual diagram. Mermaid needs the
// DOM to render (it builds an SVG via its own layout engine), so this has
// to be a Client Component — the rest of a note's markdown stays server-
// rendered, only this one block hydrates.
export default function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '-');
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('mermaid').then(({ default: mermaid }) => {
      // Theme variables matched to DESIGN.md's noir tokens instead of
      // mermaid's default blue theme, so a diagram looks native to the
      // site instead of like an embedded third-party widget.
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          background: '#0a0a0a',
          primaryColor: '#141414',
          primaryTextColor: '#f2f0ec',
          primaryBorderColor: '#8ec5de',
          lineColor: '#8a8a86',
          secondaryColor: '#141414',
          tertiaryColor: '#141414',
          fontFamily: 'var(--font-geist-mono)',
        },
      });

      mermaid
        .render(`mermaid-${id}`, chart)
        .then(({ svg }) => {
          if (!cancelled && containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="my-6 overflow-x-auto rounded border border-accent-coral/40 bg-noir-surface p-4 font-mono text-sm text-accent-coral">
        Mermaid diagram failed to render: {error}
      </pre>
    );
  }

  return <div ref={containerRef} className="my-6 overflow-x-auto rounded border border-noir-border bg-noir-surface p-4" />;
}
