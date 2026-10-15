'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjectForm from '@/components/ProjectForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Project = {
  id: number;
  title: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
};

export default function EditProjectClient({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_URL}/admin/projects/${id}`, { credentials: 'include' });
      if (!res.ok) {
        router.push('/admin');
        return;
      }
      setProject((await res.json()).project);
      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading || !project) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 md:px-10">
        <p className="font-mono text-sm text-noir-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl">Edit Project</h1>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        initialValues={{
          title: project.title,
          description: project.description,
          techStack: project.tech_stack,
          githubUrl: project.github_url,
          liveUrl: project.live_url,
          imageUrl: project.image_url,
        }}
      />
    </main>
  );
}
