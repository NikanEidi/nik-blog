'use client';

import { useState } from 'react';

// The markdown `img` renderer for note content (app/notes/[slug]/page.tsx).
// If an inline image's URL 404s or otherwise fails to load, the browser's
// default behavior is an ugly broken-image icon — this hides the image
// entirely instead, since a missing inline image shouldn't look like an
// error to a reader, it should just not be there.
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
