'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NoteForm from '@/components/NoteForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Note = {
  id: number;
  title: string;
  category: 'ai-ml' | 'backend' | 'infrastructure' | 'ios' | 'dsa';
  content: string;
  status: 'draft' | 'published';
  image_url: string | null;
};

export default function EditNoteClient({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_URL}/admin/notes/${id}`, { credentials: 'include' });
      if (!res.ok) {
        router.push('/admin');
        return;
      }
      setNote((await res.json()).note);
      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading || !note) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 md:px-10">
        <p className="font-mono text-sm text-noir-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl">Edit Note</h1>
      <NoteForm
        mode="edit"
        noteId={note.id}
        initialValues={{ ...note, imageUrl: note.image_url }}
      />
    </main>
  );
}
