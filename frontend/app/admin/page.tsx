'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Admin = { id: number; email: string };
type Item = { id: number; title: string; status: 'draft' | 'published'; pinned: boolean };

const actionBtnClass = 'font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-ice';

type StatusFilter = 'all' | 'draft' | 'published';

function StatusPill({ status }: { status: 'draft' | 'published' }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        status === 'published' ? 'border-accent-neon text-accent-neon' : 'border-noir-border text-noir-muted'
      }`}
    >
      {status}
    </span>
  );
}

// Search + status filter, shared by the Projects and Notes sections — with
// 36 synced GitHub repos, scrolling to find one item was the actual pain
// point, so this filters client-side against the list already in memory
// instead of adding a second API round-trip.
function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  resultCount,
  totalCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by title…"
        className="w-full max-w-xs border-0 border-b border-noir-border bg-transparent py-1.5 text-sm text-noir-text outline-none transition-colors placeholder:text-noir-muted focus:border-accent-ice"
      />
      <div className="flex gap-1">
        {(['all', 'draft', 'published'] as StatusFilter[]).map((option) => (
          <button
            key={option}
            onClick={() => onStatusFilterChange(option)}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
              statusFilter === option
                ? 'border-accent-ice text-accent-ice'
                : 'border-noir-border text-noir-muted hover:text-noir-text'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <span className="font-mono text-xs text-noir-muted">
        {resultCount} / {totalCount}
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [projects, setProjects] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<StatusFilter>('all');
  const [noteSearch, setNoteSearch] = useState('');
  const [noteStatusFilter, setNoteStatusFilter] = useState<StatusFilter>('all');

  const loadDashboard = useCallback(async () => {
    const meRes = await fetch(`${API_URL}/admin/me`, { credentials: 'include' });
    if (!meRes.ok) {
      router.push('/admin/login');
      return;
    }
    setAdmin((await meRes.json()).admin);

    const [projectsRes, notesRes] = await Promise.all([
      fetch(`${API_URL}/admin/projects`, { credentials: 'include' }),
      fetch(`${API_URL}/admin/notes`, { credentials: 'include' }),
    ]);
    setProjects((await projectsRes.json()).projects);
    setNotes((await notesRes.json()).notes);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function toggleStatus(kind: 'projects' | 'notes', id: number, current: 'draft' | 'published') {
    const next = current === 'draft' ? 'published' : 'draft';
    await fetch(`${API_URL}/admin/${kind}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: next }),
    });
    loadDashboard();
  }

  async function togglePinned(kind: 'projects' | 'notes', id: number, current: boolean) {
    await fetch(`${API_URL}/admin/${kind}/${id}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pinned: !current }),
    });
    loadDashboard();
  }

  async function deleteItem(kind: 'projects' | 'notes', id: number, title: string) {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) {
      return;
    }
    await fetch(`${API_URL}/${kind}/${id}`, { method: 'DELETE', credentials: 'include' });
    loadDashboard();
  }

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    router.push('/admin/login');
  }

  function applyFilters(items: Item[], search: string, statusFilter: StatusFilter) {
    return items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  const filteredProjects = applyFilters(projects, projectSearch, projectStatusFilter);
  const filteredNotes = applyFilters(notes, noteSearch, noteStatusFilter);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 md:px-10">
        <p className="font-mono text-sm text-noir-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Admin Dashboard</h1>
          <p className="mt-2 font-mono text-sm text-noir-muted">Logged in as {admin?.email}</p>
        </div>
        <button onClick={handleLogout} className={actionBtnClass}>
          Log out
        </button>
      </div>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Projects</h2>
          <Link href="/admin/projects/new" className="font-mono text-sm text-accent-ice transition-colors hover:text-noir-text">
            + New Project
          </Link>
        </div>
        <FilterBar
          search={projectSearch}
          onSearchChange={setProjectSearch}
          statusFilter={projectStatusFilter}
          onStatusFilterChange={setProjectStatusFilter}
          resultCount={filteredProjects.length}
          totalCount={projects.length}
        />
        <ul className="mt-6 divide-y divide-noir-border">
          {filteredProjects.map((project) => (
            <li key={project.id} className="flex flex-col gap-2 py-4 first:pt-0 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="flex items-center gap-3">
                <span className="font-display text-lg">{project.title}</span>
                <StatusPill status={project.status} />
                {project.pinned && <span className="font-mono text-[10px] uppercase tracking-wide text-accent-copper">Pinned</span>}
              </div>
              <div className="flex items-center gap-4">
                <button className={actionBtnClass} onClick={() => toggleStatus('projects', project.id, project.status)}>
                  {project.status === 'draft' ? 'Publish' : 'Unpublish'}
                </button>
                <button className={actionBtnClass} onClick={() => togglePinned('projects', project.id, project.pinned)}>
                  {project.pinned ? 'Unpin' : 'Pin'}
                </button>
                <Link href={`/admin/projects/${project.id}/edit`} className={actionBtnClass}>
                  Edit
                </Link>
                <button
                  className="font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-coral"
                  onClick={() => deleteItem('projects', project.id, project.title)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Notes</h2>
          <Link href="/admin/notes/new" className="font-mono text-sm text-accent-ice transition-colors hover:text-noir-text">
            + New Note
          </Link>
        </div>
        <FilterBar
          search={noteSearch}
          onSearchChange={setNoteSearch}
          statusFilter={noteStatusFilter}
          onStatusFilterChange={setNoteStatusFilter}
          resultCount={filteredNotes.length}
          totalCount={notes.length}
        />
        <ul className="mt-6 divide-y divide-noir-border">
          {filteredNotes.map((note) => (
            <li key={note.id} className="flex flex-col gap-2 py-4 first:pt-0 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="flex items-center gap-3">
                <span className="font-display text-lg">{note.title}</span>
                <StatusPill status={note.status} />
                {note.pinned && <span className="font-mono text-[10px] uppercase tracking-wide text-accent-copper">Pinned</span>}
              </div>
              <div className="flex items-center gap-4">
                <button className={actionBtnClass} onClick={() => toggleStatus('notes', note.id, note.status)}>
                  {note.status === 'draft' ? 'Publish' : 'Unpublish'}
                </button>
                <button className={actionBtnClass} onClick={() => togglePinned('notes', note.id, note.pinned)}>
                  {note.pinned ? 'Unpin' : 'Pin'}
                </button>
                <Link href={`/admin/notes/${note.id}/edit`} className={actionBtnClass}>
                  Edit
                </Link>
                <button
                  className="font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-coral"
                  onClick={() => deleteItem('notes', note.id, note.title)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
