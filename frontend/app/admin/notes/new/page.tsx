'use client';

import NoteForm from '@/components/NoteForm';

export default function NewNotePage() {
  return (
    <main>
      <h1>New Note</h1>
      <NoteForm mode="create" />
    </main>
  );
}
