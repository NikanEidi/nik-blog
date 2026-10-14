import Link from 'next/link';
import { getProjects } from '@/lib/api';

// This page fetches live data from the backend on every request, so it
// can't be pre-built at compile time (Next.js 16's Cache Components
// feature tries to do that by default). Opting out here is correct for
// now; revisit caching once the content is stable enough to make sense
// of a cache strategy (Phase 5, SEO/performance pass).
export const instant = false;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main>
      <h1>Projects</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={`/projects/${project.slug}`}>{project.title}</Link>
            {project.description && <p>{project.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
