import Link from 'next/link';
import { getProjects, getNotes } from '@/lib/api';
import GlitchText from '@/components/GlitchText';

// This page fetches live data from the backend on every request, so it
// can't be pre-built at compile time (Next.js 16's Cache Components
// feature tries to do that by default). Opting out here is correct for
// now; revisit caching once the content is stable enough to make sense
// of a cache strategy (Phase 5, SEO/performance pass).
export const instant = false;

export default async function ProjectsPage() {
  const [projects, notes] = await Promise.all([getProjects(), getNotes()]);

  // Same real-data approach as the project detail page's Related Notes
  // section — count each project's notes here instead of a separate
  // fetch per row.
  const noteCountByProject = new Map<number, number>();
  for (const note of notes) {
    if (note.project_id === null) continue;
    noteCountByProject.set(note.project_id, (noteCountByProject.get(note.project_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:px-10">
      <Link
        href="/"
        className="rounded px-1 -mx-1 font-mono text-xs uppercase tracking-wide text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
      >
        ← Home
      </Link>
      <h1 className="font-display mt-4 text-4xl md:text-5xl">
        <GlitchText as="span" intervalMs={5000}>Projects</GlitchText>
      </h1>
      <p className="mt-4 max-w-[60ch] text-noir-muted">
        Things I&apos;ve built, tested, and can defend in an interview — pulled live from GitHub and curated by hand.
      </p>

      <ul className="mt-16 divide-y divide-noir-border">
        {projects.map((project) => {
          const noteCount = noteCountByProject.get(project.id) ?? 0;
          return (
            <li key={project.id} className="flex flex-col gap-3 py-8 first:pt-0">
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
                <Link
                  href={`/projects/${project.slug}`}
                  className="rounded px-1 -mx-1 font-display text-xl underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice md:w-1/3 md:shrink-0"
                >
                  {project.title}
                </Link>
                {project.description && (
                  <p className="max-w-[60ch] text-noir-muted">{project.description}</p>
                )}
              </div>

              {(project.tech_stack.length > 0 || noteCount > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-accent-copper px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-accent-copper"
                    >
                      {tech}
                    </span>
                  ))}
                  {noteCount > 0 && (
                    <Link
                      href={`/projects/${project.slug}#related-notes`}
                      className="rounded px-1 -mx-1 font-mono text-[10px] uppercase tracking-wide text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
                    >
                      {noteCount} {noteCount === 1 ? 'note' : 'notes'} →
                    </Link>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
