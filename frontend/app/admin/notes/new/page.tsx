'use client';

import NoteForm from '@/components/NoteForm';

export default function NewNotePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl">New Note</h1>
      <NoteForm mode="create" />
    </main>
  );
}
