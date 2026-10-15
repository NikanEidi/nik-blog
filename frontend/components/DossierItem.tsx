'use client';

import Link from 'next/link';
import { useProximityTint, borderTint, backgroundTint, combineTints, textTint } from '@/lib/useProximityTint';
import { relativeTime } from '@/lib/relativeTime';

// The "dossier grid" item (DESIGN.md). `accent` is the top border color —
// a real value tied to data (a note's category, or copper for a pinned
// project) — and it also brightens toward white as the cursor glow
// approaches, along with a soft background wash across the whole cell.
export default function DossierItem({
  index,
  href,
  title,
  accent,
  corner,
  meta,
}: {
  index: number;
  href: string;
  title: string;
  accent: string;
  corner?: React.ReactNode;
  meta: React.ReactNode;
}) {
  const featured = index === 0;
  const cellRef = useProximityTint<HTMLLIElement>(420, combineTints(borderTint(accent, '#f2f0ec'), backgroundTint(0.07)));

  return (
    <li
      ref={cellRef}
      className={`relative rounded border-t-2 pt-5 ${featured ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2'}`}
      style={{ borderTopColor: accent, transition: 'border-color 0.2s ease-out, background-color 0.2s ease-out' }}
    >
      {corner && <div className="absolute right-0 top-5">{corner}</div>}
      <Link
        href={href}
        className="rounded font-display text-xl underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice md:text-2xl"
      >
        {title}
      </Link>
      <div className="mt-3">{meta}</div>
    </li>
  );
}

// Live Pulse — real data from GitHub (notes/11), not a placeholder. The
// dot itself also reacts to cursor proximity (brightens toward white),
// same reactive language as the rest of the page.
export function LivePulse({ pushedAt }: { pushedAt: string }) {
  // The wrapper's `color` is set via proximity; the inner dot uses
  // `bg-current` so it inherits that color through normal CSS cascade —
  // no need to write backgroundColor separately.
  const dotRef = useProximityTint<HTMLSpanElement>(200, textTint('#2dd9c4', '#f2f0ec'));

  return (
    <span className="flex items-center gap-1.5 font-mono text-xs text-noir-muted">
      <span ref={dotRef} className="relative flex h-2 w-2" style={{ transition: 'color 0.2s ease-out' }}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-neon opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {relativeTime(pushedAt)}
    </span>
  );
}
