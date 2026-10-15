'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isVideoUrl } from '@/lib/isVideoUrl';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const labelClass = 'font-mono text-xs uppercase tracking-wide text-noir-muted';
const inputClass =
  'w-full border-0 border-b border-noir-border bg-transparent py-2 text-noir-text outline-none transition-colors focus:border-accent-ice';

type ProjectFormValues = {
  title: string;
  description: string | null;
  techStack: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl?: string | null;
};

export default function ProjectForm({
  mode,
  projectId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  projectId?: number;
  initialValues?: ProjectFormValues;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [techStack, setTechStack] = useState((initialValues?.techStack ?? []).join(', '));
  const [githubUrl, setGithubUrl] = useState(initialValues?.githubUrl ?? '');
  const [liveUrl, setLiveUrl] = useState(initialValues?.liveUrl ?? '');
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
    // multipart/form-data with the correct boundary itself.
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const url = mode === 'create' ? `${API_URL}/projects` : `${API_URL}/projects/${projectId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const body = {
      title,
      description,
      techStack: techStack
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      githubUrl: githubUrl || null,
      liveUrl: liveUrl || null,
      imageUrl,
    };

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
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          className={`${inputClass} border`}
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="techStack" className={labelClass}>
          Tech stack (comma-separated)
        </label>
        <input
          id="techStack"
          className={inputClass}
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          placeholder="Node.js, Express, Postgres"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="githubUrl" className={labelClass}>
          GitHub URL
        </label>
        <input id="githubUrl" className={inputClass} value={githubUrl ?? ''} onChange={(e) => setGithubUrl(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="liveUrl" className={labelClass}>
          Live URL
        </label>
        <input id="liveUrl" className={inputClass} value={liveUrl ?? ''} onChange={(e) => setLiveUrl(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className={labelClass}>
          Image or video (max 10MB — short MP4/WebM clips instead of GIF, which compresses far worse)
        </label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm"
          onChange={handleImageChange}
          className="font-mono text-sm text-noir-muted file:mr-3 file:border file:border-noir-border file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase file:tracking-wide file:text-noir-text"
        />
        {uploading && <p className="font-mono text-sm text-noir-muted">Uploading…</p>}
        {imageUrl && !uploading && (
          <div className="mt-2 flex items-center gap-4">
            {isVideoUrl(imageUrl) ? (
              <video src={imageUrl} className="max-w-[200px] rounded border border-noir-border" autoPlay loop muted playsInline />
            ) : (
              <img src={imageUrl} alt="" className="max-w-[200px] rounded border border-noir-border" />
            )}
            <button type="button" onClick={() => setImageUrl(null)} className="font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-coral">
              Remove image
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-accent-coral">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start border border-accent-ice px-5 py-2 font-mono text-sm uppercase tracking-wide text-accent-ice transition-colors hover:bg-accent-ice hover:text-noir-bg disabled:opacity-50"
      >
        {saving ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save changes'}
      </button>
    </form>
  );
}
