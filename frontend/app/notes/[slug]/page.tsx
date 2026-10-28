import { isValidElement } from 'react';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getNoteBySlug } from '@/lib/api';
import MermaidDiagram from '@/components/MermaidDiagram';
import MarkdownImage from '@/components/MarkdownImage';

export const instant = false;

// Styling for rendered Markdown — mapped by hand to the noir tokens
// instead of pulling in @tailwindcss/typography, so headings/code/links
// inside a note match the rest of the site instead of a generic default.
const markdownComponents = {
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="font-display mt-10 mb-3 text-2xl" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="font-display mt-8 mb-2 text-xl" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => <p className="my-4 leading-relaxed" {...props} />,
  a: (props: React.ComponentProps<'a'>) => (
    <a
      className="rounded px-0.5 -mx-0.5 underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
      {...props}
    />
  ),
  code: (props: React.ComponentProps<'code'>) => (
    <code className="rounded bg-noir-surface px-1.5 py-0.5 font-mono text-[0.9em] text-accent-copper" {...props} />
  ),
  // A ```mermaid fenced block arrives here as <pre><code class="language-
  // mermaid">...</code></pre> — intercepted at the <pre> level so a real
  // diagram renders instead of a code block. Every other language falls
  // through to the normal highlighted <pre>.
  pre: (props: React.ComponentProps<'pre'>) => {
    const child = props.children;
    if (isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
      const className = child.props.className ?? '';
      if (className.includes('language-mermaid')) {
        return <MermaidDiagram chart={String(child.props.children).trim()} />;
      }
    }
    return (
      <pre className="my-6 overflow-x-auto rounded bg-noir-surface p-4 font-mono text-sm [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-noir-text" {...props} />
    );
  },
  ul: (props: React.ComponentProps<'ul'>) => <ul className="my-4 list-disc space-y-1 pl-6" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="my-4 list-decimal space-y-1 pl-6" {...props} />,
  blockquote: (props: React.ComponentProps<'blockquote'>) => (
    <blockquote className="my-4 border-l-2 border-noir-border pl-4 text-noir-muted" {...props} />
  ),
  // GFM pipe tables (`remarkGfm`) arrive as plain <table>/<th>/<td> with no
  // styling of their own — mapped to the noir tokens the same way code
  // blocks and blockquotes are, instead of relying on browser defaults.
  table: (props: React.ComponentProps<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: React.ComponentProps<'thead'>) => (
    <thead className="border-b border-noir-border font-mono text-xs uppercase tracking-wide text-noir-muted" {...props} />
  ),
  th: (props: React.ComponentProps<'th'>) => <th className="px-3 py-2 text-left" {...props} />,
  td: (props: React.ComponentProps<'td'>) => (
    <td className="border-b border-noir-border px-3 py-2 align-top" {...props} />
  ),
  // An inline image that 404s should just not render, not show the
  // browser's default broken-image icon — see MarkdownImage.
  img: (props: React.ComponentProps<'img'>) => <MarkdownImage src={props.src} alt={props.alt} />,
};

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-20 md:px-10">
      <span className="font-mono text-sm uppercase tracking-wide text-noir-muted">{note.category}</span>
      <h1 className="font-display mt-2 text-4xl md:text-5xl">{note.title}</h1>

      {note.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={note.image_url} alt="" className="mt-8 w-full rounded border border-noir-border" />
      )}

      <article className="mt-12 max-w-[68ch]">
        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {note.content}
        </ReactMarkdown>
      </article>
    </main>
  );
}
