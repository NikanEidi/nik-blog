import Link from 'next/link';
import type { Metadata } from 'next';
import { getProjects, getNotes, type Project, type Note } from '@/lib/api';
import GlitchText from '@/components/GlitchText';
import ReactiveText from '@/components/ReactiveText';
import DossierItem, { LivePulse } from '@/components/DossierItem';
import { categoryColor } from '@/lib/categoryColors';

export const instant = false;

export const metadata: Metadata = {
  title: 'Nikan Eidi — Full-stack developer',
  description:
    'Full-stack developer in Canada and Seneca Polytechnic CPA graduate. Real projects, real notes from building them — backend APIs, databases, auth, and the bugs along the way.',
};

const ACCENT_COPPER = '#b5703f';
const NOIR_BORDER = '#2a2a28';

export default async function Home() {
  const [projects, notes] = await Promise.all([getProjects(), getNotes()]);
  const featuredProjects = projects.slice(0, 3);
  const featuredNotes = notes.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-6 py-20 md:px-10">
      <h1 className="font-display text-5xl md:text-7xl">
        <GlitchText as="span">Nikan Eidi</GlitchText>
      </h1>

      <ReactiveText as="p" muted radius={360} className="mt-6 max-w-[62ch] text-lg leading-relaxed">
        Full-stack developer based in Canada, and a Computer Programming &amp; Analysis graduate from Seneca
        Polytechnic. I build real systems — backend APIs, databases, auth, the parts that actually run in
        production — and write about what I&apos;m actually learning as I build them, not just when a project
        ships.
      </ReactiveText>

      {/* Projects preview — dossier grid, Live Pulse = real GitHub push time */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between">
          <ReactiveText as="h2" radius={300} className="font-display text-2xl">
            Projects
          </ReactiveText>
          <Link
            href="/projects"
            className="rounded px-1 -mx-1 font-mono text-sm text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
          >
            View more →
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-6">
          {featuredProjects.map((project: Project, i: number) => (
            <DossierItem
              key={project.id}
              index={i}
              href={`/projects/${project.slug}`}
              title={project.title}
              accent={project.pinned ? ACCENT_COPPER : NOIR_BORDER}
              corner={project.github_pushed_at && <LivePulse pushedAt={project.github_pushed_at} />}
              meta={project.description && <p className="max-w-[48ch] text-noir-muted">{project.description}</p>}
            />
          ))}
        </ul>
      </section>

      {/* Notes preview — dossier grid, accent bar = category color */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <ReactiveText as="h2" radius={300} className="font-display text-2xl">
            Notes
          </ReactiveText>
          <Link
            href="/notes"
            className="rounded px-1 -mx-1 font-mono text-sm text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
          >
            View more →
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-6">
          {featuredNotes.map((note: Note, i: number) => (
            <DossierItem
              key={note.id}
              index={i}
              href={`/notes/${note.slug}`}
              title={note.title}
              accent={categoryColor(note.category)}
              meta={
                <span className="font-mono text-sm uppercase tracking-wide" style={{ color: categoryColor(note.category) }}>
                  {note.category}
                </span>
              }
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
