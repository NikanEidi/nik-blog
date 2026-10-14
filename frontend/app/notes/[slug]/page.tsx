import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getNoteBySlug } from '@/lib/api';

export const instant = false;

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <main>
      <h1>{note.title}</h1>
      <p>Category: {note.category}</p>
      <article>
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </article>
    </main>
  );
}
