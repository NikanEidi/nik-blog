'use client';

import { useState } from 'react';

// Markdown `img` renderer for note content — hides the image entirely on
// load failure instead of the browser's default broken-image icon.
export default function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      className="my-6 w-full rounded border border-noir-border"
      onError={() => setBroken(true)}
    />
  );
}
