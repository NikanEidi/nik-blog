'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Exchange = { question: string; answer: string };

// A smaller, chat-appropriate subset of the component map in
// app/notes/[slug]/page.tsx — no headings/tables/mermaid, since an answer
// here is a few sentences, not an article. Paragraph spacing is tighter
// (my-1 vs my-4) so multi-paragraph answers don't blow out the panel.
const answerMarkdownComponents = {
  p: (props: React.ComponentProps<'p'>) => <p className="my-1 first:mt-0 last:mb-0" {...props} />,
  a: (props: React.ComponentProps<'a'>) => (
    <a
      className="rounded px-0.5 -mx-0.5 underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: (props: React.ComponentProps<'code'>) => (
    <code className="rounded bg-noir-surface px-1 py-0.5 font-mono text-[0.85em] text-accent-copper" {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => <ul className="my-1 list-disc space-y-0.5 pl-5" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="my-1 list-decimal space-y-0.5 pl-5" {...props} />,
};

// Floating round launcher (bottom-right) + a preview-style panel, reusing
// the same mount-in animation as the notes hover preview (globals.css
// `.glitch-in`) instead of inventing a second transition for this site.
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click-outside-to-close — only listens while open, and ignores clicks
  // on the launcher button itself (it already has its own toggle).
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setQuestion('');

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : "Something went wrong — try asking again.";
      setHistory((prev) => [...prev, { question: q, answer }]);
    } catch {
      setHistory((prev) => [
        ...prev,
        { question: q, answer: "Couldn't reach the assistant — check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
      // Next tick, so the new message is in the DOM before we scroll to it.
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 0);
    }
  }

  return (
    <>
      {open && (
        <aside
          key="chat-panel"
          ref={panelRef}
          className="glitch-in fixed bottom-40 right-4 z-50 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col border border-noir-border bg-noir-surface/95 backdrop-blur-sm sm:bottom-44 sm:right-6 sm:w-96"
        >
          <header className="flex items-center justify-between border-b border-noir-border px-4 py-3">
            <div>
              <p className="font-display text-sm leading-tight">Ask about Nikan&apos;s work</p>
              <p className="font-mono text-[10px] uppercase tracking-wide text-noir-muted">
                Answers come from his real projects &amp; notes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-coral"
            >
              Close
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {history.length === 0 && !loading && (
              <p className="text-sm leading-relaxed text-noir-muted">
                Ask about a project, a technical decision, or something from one of the notes — e.g.
                &quot;How does LedgerLite handle retried transfers?&quot;
              </p>
            )}

            {history.map((exchange, i) => (
              <div key={i} className="glitch-in">
                <p
                  className="font-mono text-[10px] uppercase tracking-wide"
                  style={{ color: 'var(--color-accent-ice)' }}
                >
                  You asked
                </p>
                <p className="mt-1 text-sm text-noir-text">{exchange.question}</p>
                <div className="mt-2 text-sm leading-relaxed text-noir-muted">
                  <ReactMarkdown components={answerMarkdownComponents} remarkPlugins={[remarkGfm]}>
                    {exchange.answer}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <p className="glitch-active font-mono text-xs uppercase tracking-wide text-noir-muted">
                Thinking…
              </p>
            )}
          </div>

          <form onSubmit={handleAsk} className="flex items-center gap-2 border-t border-noir-border p-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type a question…"
              disabled={loading}
              className="w-full border-0 border-b border-noir-border bg-transparent py-1.5 text-sm text-noir-text outline-none transition-colors focus:border-accent-ice"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              aria-label="Send"
              className="shrink-0 font-mono text-xs uppercase tracking-wide text-noir-muted transition-colors hover:text-accent-ice disabled:opacity-40 disabled:hover:text-noir-muted"
            >
              Ask
            </button>
          </form>
        </aside>
      )}

      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Ask about Nikan\'s work'}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-noir-border bg-noir-surface/90 text-noir-text backdrop-blur-sm transition-colors hover:text-accent-ice sm:bottom-24 sm:right-6"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}
