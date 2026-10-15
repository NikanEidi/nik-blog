'use client';

import ProjectForm from '@/components/ProjectForm';

export default function NewProjectPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl">New Project</h1>
      <ProjectForm mode="create" />
    </main>
  );
}
