'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const labelClass = 'font-mono text-xs uppercase tracking-wide text-noir-muted';
const inputClass =
  'w-full border-0 border-b border-noir-border bg-transparent py-2 text-noir-text outline-none transition-colors focus:border-accent-ice';

const CATEGORIES = ['ai-ml', 'backend', 'infrastructure', 'ios', 'dsa'] as const;

type NoteFormValues = {
  title: string;
  category: (typeof CATEGORIES)[number];
  content: string;
  status?: 'draft' | 'published';
  imageUrl?: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    // No Content-Type header here on purpose — the browser sets
    // multipart/form-data with the correct boundary itself. Setting it
    // manually would omit the boundary and the backend couldn't parse the
    // upload at all.
    const res = await fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    setUploading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Image upload failed');
      return;
    }

    setImageUrl((await res.json()).url);
  }

  // Reads a local .md file straight into the content field — for notes
  // already written elsewhere (langchain-practice/notes/, k8s-practice,
  // etc.) instead of re-typing or copy-pasting them by hand. Parsed
  // entirely client-side; nothing is uploaded until the form is submitted.
  async function handleMarkdownFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setContent(text);

    if (!title) {
      const heading = text.match(/^#\s+(.+)$/m);
      setTitle(heading ? heading[1].trim() : file.name.replace(/\.md$/i, '').replace(/[-_]+/g, ' '));
    }
  }

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
    const body: Record<string, unknown> = { title, category, content, imageUrl };
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
    <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className={labelClass}>
          Category
        </label>
        <select
          id="category"
          className={`${inputClass} appearance-none`}
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-noir-bg">
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className={labelClass}>
          Image
        </label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleImageChange}
          className="font-mono text-sm text-noir-muted file:mr-3 file:border file:border-noir-border file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase file:tracking-wide file:text-noir-text"
        />
        {uploading && <p className="font-mono text-sm text-noir-muted">Uploading…</p>}
        {imageUrl && !uploading && (
          <div className="mt-2 flex items-center gap-4">
            <img src={imageUrl} alt="" className="max-w-[200px] rounded border border-noir-border" />
            <button type="button" onClick={() => setImageUrl(null)} className="font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-coral">
              Remove image
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="content" className={labelClass}>
            Content (Markdown)
          </label>
          <label
            htmlFor="mdFile"
            className="cursor-pointer font-mono text-xs uppercase tracking-wide text-accent-ice transition-colors hover:text-noir-text"
          >
            Upload .md file
          </label>
          <input id="mdFile" type="file" accept=".md,text/markdown" onChange={handleMarkdownFileChange} className="hidden" />
        </div>
        <textarea
          id="content"
          className={`${inputClass} border font-mono text-sm leading-relaxed`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          required
        />
      </div>
      {error && <p className="text-sm text-accent-coral">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start border border-accent-ice px-5 py-2 font-mono text-sm uppercase tracking-wide text-accent-ice transition-colors hover:bg-accent-ice hover:text-noir-bg disabled:opacity-50"
      >
        {saving ? 'Saving…' : mode === 'create' ? 'Create note' : 'Save changes'}
      </button>
    </form>
  );
}
