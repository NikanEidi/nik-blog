import Link from 'next/link';
import { getNotes, type Note } from '@/lib/api';
import GlitchText from '@/components/GlitchText';
import NotesListWithPreview from '@/components/NotesListWithPreview';

export const instant = false;

// A numbered series title ("07: Full RAG") should read in that order, not
// the API's pinned/recency order — notes often get edited (bumping
// created_at-adjacent sorting) well after the series was written, which
// scrambles 01..08 into whatever order they were last touched. Pull the
// leading number out of the title and sort by it; titles with no leading
// number keep their original (pinned, then recency) relative order and sort
// after any numbered ones, via a stable sort.
function leadingNumber(title: string): number {
  // Trim first — a stray leading space (easy to type by accident in the
  // admin form) would otherwise make the anchored regex miss a real
  // "05: ..." title entirely and silently drop it to the end.
  const match = /^(\d+)\s*[-.:—–]/.exec(title.trim());
  return match ? Number(match[1]) : Infinity;
}

// Groups notes by category (preserving first-appearance order from the
// already-sorted API list for section ordering), then sorts each
// category's notes into reading order.
function groupByCategory(notes: Note[]): [string, Note[]][] {
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    const existing = groups.get(note.category);
    if (existing) {
      existing.push(note);
    } else {
      groups.set(note.category, [note]);
    }
  }
  for (const categoryNotes of groups.values()) {
    categoryNotes.sort((a, b) => leadingNumber(a.title) - leadingNumber(b.title));
  }
  return [...groups.entries()];
}

export default async function NotesPage() {
  const notes = await getNotes();
  const grouped = groupByCategory(notes);

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:px-10">
      <Link
        href="/"
        className="rounded px-1 -mx-1 font-mono text-xs uppercase tracking-wide text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
      >
        ← Home
      </Link>
      <h1 className="font-display mt-4 text-4xl md:text-5xl">
        <GlitchText as="span" intervalMs={5000}>Notes</GlitchText>
      </h1>
      <p className="mt-4 max-w-[60ch] text-noir-muted">
        Working notes from real build sessions — what I built, why it&apos;s built that way, and the bugs along the
        way.
      </p>

      <NotesListWithPreview grouped={grouped} />
    </main>
  );
}
