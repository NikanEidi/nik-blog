import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getNotes } from '@/lib/api';
import { LivePulse } from '@/components/DossierItem';
import { categoryColor } from '@/lib/categoryColors';
import { isVideoUrl } from '@/lib/isVideoUrl';

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

  // Real data already sitting in the schema (a note's `project_id`) instead
  // of adding decoration to fill the page — a project with write-ups gets
  // them surfaced right here instead of only being findable from /notes.
  const allNotes = await getNotes();
  const relatedNotes = allNotes.filter((note) => note.project_id === project.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 md:px-10">
      <Link
        href="/projects"
        className="rounded px-1 -mx-1 font-mono text-xs uppercase tracking-wide text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
      >
        ← All Projects
      </Link>
      <div className="mt-8">
        {project.github_pushed_at && <LivePulse pushedAt={project.github_pushed_at} />}
        <h1 className="font-display mt-2 text-4xl md:text-5xl">{project.title}</h1>
      </div>

      {project.image_url && isVideoUrl(project.image_url) && (
        <video
          src={project.image_url}
          className="mt-8 w-full rounded border border-noir-border"
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      {project.image_url && !isVideoUrl(project.image_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.image_url} alt="" className="mt-8 w-full rounded border border-noir-border" />
      )}

      {project.description && (
        <p className="mt-8 max-w-[65ch] leading-relaxed text-noir-text">{project.description}</p>
      )}

      {project.tech_stack.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.tech_stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-accent-copper px-3 py-1 font-mono text-xs uppercase tracking-wide text-accent-copper"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {(project.github_url || project.live_url) && (
        <div className="mt-10 flex flex-wrap gap-6 border-t border-noir-border pt-8">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-1 -mx-1 font-mono text-sm uppercase tracking-wide underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
            >
              View source on GitHub →
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-1 -mx-1 font-mono text-sm uppercase tracking-wide underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
            >
              Live demo →
            </a>
          )}
        </div>
      )}

      {relatedNotes.length > 0 && (
        <div id="related-notes" className="mt-16 scroll-mt-20 border-t border-noir-border pt-8">
          <h2 className="font-mono text-xs uppercase tracking-wide text-noir-muted">Related Notes</h2>
          <ul className="mt-4 divide-y divide-noir-border">
            {relatedNotes.map((note) => (
              <li key={note.id} className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
                <Link
                  href={`/notes/${note.slug}`}
                  className="rounded px-1 -mx-1 font-display text-lg underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
                >
                  {note.title}
                </Link>
                <span
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wide"
                  style={{ color: categoryColor(note.category) }}
                >
                  {note.category}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
