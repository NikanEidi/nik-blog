import Link from 'next/link';
import { getProjects } from '@/lib/api';
import GlitchText from '@/components/GlitchText';

// This page fetches live data from the backend on every request, so it
// can't be pre-built at compile time (Next.js 16's Cache Components
// feature tries to do that by default). Opting out here is correct for
// now; revisit caching once the content is stable enough to make sense
// of a cache strategy (Phase 5, SEO/performance pass).
export const instant = false;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl">
        <GlitchText as="span" intervalMs={5000}>Projects</GlitchText>
      </h1>
      <p className="mt-4 max-w-[60ch] text-noir-muted">
        Things I&apos;ve built, tested, and can defend in an interview — pulled live from GitHub and curated by hand.
      </p>

      <ul className="mt-16 divide-y divide-noir-border">
        {projects.map((project) => (
          <li key={project.id} className="flex flex-col gap-2 py-8 first:pt-0 md:flex-row md:items-baseline md:justify-between md:gap-8">
            <Link
              href={`/projects/${project.slug}`}
              className="rounded px-1 -mx-1 font-display text-xl underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice md:w-1/3 md:shrink-0"
            >
              {project.title}
            </Link>
            {project.description && (
              <p className="max-w-[60ch] text-noir-muted">{project.description}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
