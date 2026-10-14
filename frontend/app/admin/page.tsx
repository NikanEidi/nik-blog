'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Admin = { id: number; email: string };
type Item = { id: number; title: string; status: 'draft' | 'published' };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [projects, setProjects] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <main>Loading...</main>;
  }

  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>Logged in as {admin?.email}</p>

      <h2>Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            {project.title} — {project.status}{' '}
            <button onClick={() => toggleStatus('projects', project.id, project.status)}>
              {project.status === 'draft' ? 'Publish' : 'Unpublish'}
            </button>
          </li>
        ))}
      </ul>

      <h2>Notes</h2>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            {note.title} — {note.status}{' '}
            <button onClick={() => toggleStatus('notes', note.id, note.status)}>
              {note.status === 'draft' ? 'Publish' : 'Unpublish'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
