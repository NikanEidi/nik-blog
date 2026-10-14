'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = ['ai-ml', 'backend', 'infrastructure', 'ios', 'dsa'] as const;

type NoteFormValues = {
  title: string;
  category: (typeof CATEGORIES)[number];
  content: string;
  status?: 'draft' | 'published';
};

export default function NoteForm({
  mode,
  noteId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  noteId?: number;
  initialValues?: NoteFormValues;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(initialValues?.category ?? 'backend');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const url = mode === 'create' ? `${API_URL}/notes` : `${API_URL}/notes/${noteId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    // PUT /notes/:id writes `status` straight into the SQL UPDATE, so an
    // edit has to resend the note's current status — otherwise it would
    // be sent as undefined and the database update would fail. Create
    // doesn't need this: a new note always starts as 'draft' by default.
    const body: Record<string, unknown> = { title, category, content };
    if (mode === 'edit') {
      body.status = initialValues?.status ?? 'draft';
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Something went wrong');
      return;
    }

    router.push('/admin');
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="content">Content (Markdown)</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          required
        />
      </div>
      {error && <p>{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : mode === 'create' ? 'Create note' : 'Save changes'}
      </button>
    </form>
  );
}
