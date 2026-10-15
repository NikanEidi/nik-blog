import Link from 'next/link';
import { relativeTime } from '@/lib/relativeTime';

// The "dossier grid" item (DESIGN.md). `accent` is the top border color —
// a real value tied to data (a note's category, or copper for a pinned
// project) — and it stays fixed; it no longer brightens toward white on
// cursor proximity (dropped per feedback, 2026-10-15 — the glass/frosted
// hover effect read as noise, not polish). Only the title link itself
// still reacts, via plain CSS :hover to ice.
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

  return (
    <li
      className={`relative rounded border-t-2 pt-5 ${featured ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2'}`}
      style={{ borderTopColor: accent }}
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
// dot's color is now fixed (no proximity brightening, same 2026-10-15
// change as the cell border above).
export function LivePulse({ pushedAt }: { pushedAt: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs text-noir-muted">
      <span className="relative flex h-2 w-2 text-accent-neon">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-neon opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {relativeTime(pushedAt)}
    </span>
  );
}
