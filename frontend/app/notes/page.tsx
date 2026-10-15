import Link from 'next/link';
import { getNotes } from '@/lib/api';

export const instant = false;

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl">Notes</h1>
      <p className="mt-4 max-w-[60ch] text-noir-muted">
        Working notes from real build sessions — what I built, why it&apos;s built that way, and the bugs along the
        way.
      </p>

      <ul className="mt-16 divide-y divide-noir-border">
        {notes.map((note) => (
          <li key={note.id} className="flex flex-col gap-2 py-8 first:pt-0 md:flex-row md:items-baseline md:justify-between md:gap-8">
            <Link
              href={`/notes/${note.slug}`}
              className="rounded px-1 -mx-1 font-display text-xl underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice md:w-2/3 md:shrink-0"
            >
              {note.title}
            </Link>
            <span className="font-mono text-sm uppercase tracking-wide text-noir-muted">{note.category}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
