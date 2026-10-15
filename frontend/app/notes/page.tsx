import Link from 'next/link';
import { getNotes, type Note } from '@/lib/api';
import GlitchText from '@/components/GlitchText';
import { categoryColor } from '@/lib/categoryColors';

export const instant = false;

// Groups notes by category, preserving each category's first-appearance
// order in the already-sorted (pinned, then recency) list from the API —
// so sections land in a reasonable order without a second sort pass.
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

      {grouped.map(([category, categoryNotes]) => (
        <section key={category} className="mt-16">
          <h2
            className="border-l-2 pl-3 font-mono text-xs uppercase tracking-wide"
            style={{ borderColor: categoryColor(category), color: categoryColor(category) }}
          >
            {category}
          </h2>
          <ul className="mt-4 divide-y divide-noir-border">
            {categoryNotes.map((note) => (
              <li key={note.id} className="py-6 first:pt-0">
                <Link
                  href={`/notes/${note.slug}`}
                  className="rounded px-1 -mx-1 font-display text-xl underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
                >
                  {note.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
