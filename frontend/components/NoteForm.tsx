'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { measureSubstring, type OverlayRect } from '@/lib/textareaOverlay';

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

// A Markdown image tag whose path isn't a real uploaded URL — a local path
// left over from a .md file written elsewhere, which can't resolve once
// published. start/end are offsets into content, used to replace exactly
// that occurrence.
type DetectedImage = { fullMatch: string; alt: string; path: string; start: number; end: number };

function detectLocalImages(content: string): DetectedImage[] {
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  const found: DetectedImage[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const [fullMatch, alt, path] = match;
    if (!/^https?:\/\//i.test(path)) {
      found.push({ fullMatch, alt, path, start: match.index, end: match.index + fullMatch.length });
    }
  }
  return found;
}

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

  // Inserts an image into the content textarea at the cursor position,
  // separate from the cover-image field above.
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const [insertingImage, setInsertingImage] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);
  // Scales the insert button with the textarea's resize handle. A native
  // resize doesn't fire a React event, so this is tracked via ResizeObserver.
  const [iconScale, setIconScale] = useState(1);

  const detectedImages = useMemo(() => detectLocalImages(content), [content]);
  const detectedImagesRef = useRef<DetectedImage[]>(detectedImages);
  useEffect(() => {
    detectedImagesRef.current = detectedImages;
  }, [detectedImages]);

  // Pixel position of each detected image tag within the textarea, so a
  // button can sit exactly on top of it instead of in a separate list.
  const [overlayRects, setOverlayRects] = useState<Record<number, OverlayRect>>({});

  const recomputeOverlays = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const next: Record<number, OverlayRect> = {};
    for (const img of detectedImagesRef.current) {
      next[img.start] = measureSubstring(el, img.start, img.end);
    }
    setOverlayRects(next);
  }, []);

  useEffect(() => {
    recomputeOverlays();
  }, [detectedImages, recomputeOverlays]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const baseHeight = el.getBoundingClientRect().height || 1;
    const observer = new ResizeObserver(([entry]) => {
      const scale = entry.contentRect.height / baseHeight;
      // Clamped so the button stays a usable size at both extremes.
      setIconScale(Math.min(1.6, Math.max(0.85, scale)));
      recomputeOverlays();
    });
    observer.observe(el);
    el.addEventListener('scroll', recomputeOverlays);
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', recomputeOverlays);
    };
  }, [recomputeOverlays]);

  const fixImageInputRef = useRef<HTMLInputElement>(null);
  const [fixTarget, setFixTarget] = useState<DetectedImage | null>(null);
  const [fixingStart, setFixingStart] = useState<number | null>(null);

  function startFix(img: DetectedImage) {
    setFixTarget(img);
    fixImageInputRef.current?.click();
  }

  // Replaces one specific detected path, not every occurrence. start/end
  // are only trusted if the content at that range still matches what was
  // detected; otherwise falls back to the first remaining occurrence.
  async function handleFixImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = fixTarget;
    if (!file || !target) return;

    setFixingStart(target.start);
    setInsertError(null);

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    setFixingStart(null);
    setFixTarget(null);
    e.target.value = '';

    if (!res.ok) {
      const data = await res.json();
      setInsertError(data.message || 'Image upload failed');
      return;
    }

    const { url } = await res.json();
    const replacement = `![${target.alt}](${url})`;

    setContent((current) => {
      if (current.slice(target.start, target.end) === target.fullMatch) {
        return current.slice(0, target.start) + replacement + current.slice(target.end);
      }
      const idx = current.indexOf(target.fullMatch);
      if (idx === -1) return current;
      return current.slice(0, idx) + replacement + current.slice(idx + target.fullMatch.length);
    });
  }

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

  // Uploads an image and inserts a Markdown image tag at the cursor position.
  async function handleInsertContentImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const textarea = textareaRef.current;
    if (!file || !textarea) return;

    // Read the cursor position now — the textarea may lose focus by the
    // time the upload resolves.
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

    // Wait for the re-render before moving the cursor after the inserted tag.
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
        <div className="relative overflow-hidden">
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
          {/* A small round icon at the start of each detected local image
              tag, not stretched to the tag's full text width. */}
          {detectedImages.map((img) => {
            const rect = overlayRects[img.start];
            if (!rect) return null;
            const size = Math.min(20, Math.max(16, rect.height - 4));
            return (
              <button
                key={img.start}
                type="button"
                title={img.path}
                aria-label={`Replace ${img.path} with an uploaded image`}
                onClick={() => startFix(img)}
                disabled={fixingStart === img.start}
                style={{ left: rect.left, top: rect.top + (rect.height - size) / 2, width: size, height: size }}
                className="image-insert-btn absolute flex items-center justify-center rounded-full border border-accent-ice bg-noir-bg text-accent-ice transition-colors hover:bg-accent-ice hover:text-noir-bg disabled:opacity-50"
              >
                {fixingStart === img.start ? (
                  <span className="font-mono text-[9px]">…</span>
                ) : (
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2.5v11M2.5 8h11" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        {insertError && <p className="text-sm text-accent-coral">{insertError}</p>}
        <input
          ref={fixImageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFixImage}
          className="hidden"
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
