import Link from 'next/link';
import { getNotes, type Note } from '@/lib/api';
import GlitchText from '@/components/GlitchText';
import NotesListWithPreview from '@/components/NotesListWithPreview';
import { sortByLeadingNumber } from '@/lib/noteSort';

export const instant = false;

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
  return [...groups.entries()].map(([category, categoryNotes]) => [category, sortByLeadingNumber(categoryNotes)]);
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
