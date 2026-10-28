'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Note } from '@/lib/api';
import { categoryColor } from '@/lib/categoryColors';
import { excerptFromMarkdown } from '@/lib/excerpt';

// Desktop-only (lg+) fixed panel showing a preview of the hovered note.
// `key={hovered.slug}` forces a remount on each hover change, which is
// what retriggers the glitch-in CSS animation.
export default function NotesListWithPreview({ grouped }: { grouped: [string, Note[]][] }) {
  const [hovered, setHovered] = useState<Note | null>(null);

  return (
    <div className="relative">
      {grouped.map(([category, categoryNotes]) => (
        <section key={category} className="mt-16">
          <h2
            className="border-l-2 pl-3 font-mono text-xs uppercase tracking-wide"
            style={{ borderColor: categoryColor(category), color: categoryColor(category) }}
          >
            {category}
          </h2>
          <ul className="mt-4 divide-y divide-noir-border">
            {categoryNotes.map((note) => (
              <li key={note.id} className="py-6 first:pt-0">
                <Link
                  href={`/notes/${note.slug}`}
                  onMouseEnter={() => setHovered(note)}
                  onMouseLeave={() => setHovered((current) => (current?.id === note.id ? null : current))}
                  className="rounded px-1 -mx-1 font-display text-xl underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
                >
                  {note.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <aside
        className={`pointer-events-none fixed right-8 top-1/2 hidden w-72 -translate-y-1/2 border border-noir-border bg-noir-surface/90 p-5 backdrop-blur-sm transition-opacity duration-200 lg:block ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hovered && (
          <div key={hovered.slug} className="glitch-in">
            <span
              className="font-mono text-[10px] uppercase tracking-wide"
              style={{ color: categoryColor(hovered.category) }}
            >
              {hovered.category}
            </span>
            <p className="glitch-in-title font-display mt-1.5 text-lg leading-snug">{hovered.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-noir-muted">
              {excerptFromMarkdown(hovered.content) || 'No preview available.'}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
