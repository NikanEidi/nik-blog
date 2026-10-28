'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const labelClass = 'font-mono text-xs uppercase tracking-wide text-noir-muted';
const inputClass =
  'w-full border-0 border-b border-noir-border bg-transparent py-2 text-noir-text outline-none transition-colors focus:border-accent-ice';

type NoteFormValues = {
  title: string;
  category: string;
  content: string;
  status?: 'draft' | 'published';
  imageUrl?: string | null;
  projectId?: number | null;
};

type ProjectOption = { id: number; title: string };

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
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [projectId, setProjectId] = useState<number | null>(initialValues?.projectId ?? null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The "+" button that inserts an image into the content textarea itself
  // (separate from the cover-image field above). textareaRef tracks cursor
  // position for insertion; contentImageInputRef is the hidden file input
  // it triggers; insertingImage is its own loading flag, independent of
  // `uploading` (the cover-image field's), so uploading one doesn't show a
  // spinner state on the other.
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const [insertingImage, setInsertingImage] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);
  // Scales the "+" button with the textarea's own resize handle (it's a
  // native `resize: vertical` field) — tracked via ResizeObserver since
  // a drag-resize doesn't fire any React event on its own.
  const [iconScale, setIconScale] = useState(1);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const baseHeight = el.getBoundingClientRect().height || 1;
    const observer = new ResizeObserver(([entry]) => {
      const scale = entry.contentRect.height / baseHeight;
      // Clamp so the button stays usable at both extremes — a 4x taller
      // textarea shouldn't make the icon absurdly large, and a collapsed
      // one shouldn't shrink it past being clickable.
      setIconScale(Math.min(1.6, Math.max(0.85, scale)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Powers the "Related Notes" section on a project's detail page
  // (projects/13-project-detail-page-design.md) — without this field, a
  // note's `project_id` (already supported by the backend) was never
  // actually reachable from the UI.
  useEffect(() => {
    fetch(`${API_URL}/admin/projects`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []));
  }, []);

  // Category is a free-text tag Nikan types himself, not a fixed list — he
  // owns keeping the naming consistent. This just offers what's already
  // been used as browser-native autocomplete suggestions, it never
  // restricts the field to them.
  useEffect(() => {
    fetch(`${API_URL}/admin/notes`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const categories: string[] = (data.notes ?? []).map((n: { category: string }) => n.category);
        setExistingCategories([...new Set(categories)].sort());
      });
  }, []);

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

  // Uploads an image to the same /admin/upload endpoint as the cover image,
  // but instead of setting a separate field, inserts a real Markdown image
  // tag with the real S3 URL directly into the content at the cursor's
  // position — the fix for notes whose uploaded .md file referenced a local
  // image path that could never resolve once published.
  async function handleInsertContentImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const textarea = textareaRef.current;
    if (!file || !textarea) return;

    // Capture the cursor position before the async upload — by the time it
    // resolves, the textarea may have lost focus (selectionStart would then
    // read as stale/0), so this is the only reliable moment to read it.
    const cursor = textarea.selectionStart ?? content.length;

    setInsertingImage(true);
    setInsertError(null);

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    setInsertingImage(false);
    e.target.value = '';

    if (!res.ok) {
      const data = await res.json();
      setInsertError(data.message || 'Image upload failed');
      return;
    }

    const { url } = await res.json();
    const markdownImage = `![](${url})`;
    const next = `${content.slice(0, cursor)}${markdownImage}${content.slice(cursor)}`;
    setContent(next);

    // Put the cursor right after the inserted tag, not wherever it happens
    // to land by default — React re-renders async, so this has to wait a
    // tick for the textarea's value to actually update first.
    const cursorAfter = cursor + markdownImage.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorAfter, cursorAfter);
    });
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
    const body: Record<string, unknown> = { title, category, content, imageUrl, projectId };
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
        <input
          id="category"
          list="categoryOptions"
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. backend"
          required
        />
        <datalist id="categoryOptions">
          {existingCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project" className={labelClass}>
          Project (optional)
        </label>
        <select
          id="project"
          className={`${inputClass} appearance-none`}
          value={projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="" className="bg-noir-bg">
            None
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-noir-bg">
              {p.title}
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
        <div className="relative">
          <textarea
            id="content"
            ref={textareaRef}
            className={`${inputClass} resize-y border font-mono text-sm leading-relaxed`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            required
          />
          <button
            type="button"
            title="Insert image at cursor"
            aria-label="Insert image at cursor"
            onClick={() => contentImageInputRef.current?.click()}
            disabled={insertingImage}
            style={{ transform: `scale(${iconScale})`, transformOrigin: 'top right' }}
            className="image-insert-btn absolute top-3 right-3 flex h-7 w-7 items-center justify-center border border-accent-ice bg-noir-bg/80 text-accent-ice backdrop-blur-sm transition-colors hover:bg-accent-ice hover:text-noir-bg disabled:opacity-50"
          >
            {insertingImage ? (
              <span className="font-mono text-[10px]">…</span>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2.5v11M2.5 8h11" />
              </svg>
            )}
          </button>
          <input
            ref={contentImageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleInsertContentImage}
            className="hidden"
          />
        </div>
        {insertError && <p className="text-sm text-accent-coral">{insertError}</p>}
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
