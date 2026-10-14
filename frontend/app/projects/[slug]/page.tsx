import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/lib/api';

export const instant = false;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <main>
      <h1>{project.title}</h1>
      {project.description && <p>{project.description}</p>}
      {project.tech_stack.length > 0 && <p>Tech: {project.tech_stack.join(', ')}</p>}
      {project.github_url && (
        <p>
          <a href={project.github_url} target="_blank" rel="noopener noreferrer">
            View source on GitHub
          </a>
        </p>
      )}
      {project.live_url && (
        <p>
          <a href={project.live_url} target="_blank" rel="noopener noreferrer">
            Live demo
          </a>
        </p>
      )}
    </main>
  );
}
