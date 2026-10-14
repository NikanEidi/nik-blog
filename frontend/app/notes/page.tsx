import Link from 'next/link';
import { getNotes } from '@/lib/api';

export const instant = false;

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <main>
      <h1>Notes</h1>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <Link href={`/notes/${note.slug}`}>{note.title}</Link> — {note.category}
          </li>
        ))}
      </ul>
    </main>
  );
}
