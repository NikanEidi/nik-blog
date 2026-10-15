'use client';

// Client Component specifically so `new Date()` doesn't trip Next.js 16's
// Cache Components prerendering check (same reasoning as CursorGlow) — the
// footer sits in the root layout, shared by every route, including ones
// that don't opt into `instant = false`.
const LINKS = [
  { label: 'GitHub', href: 'https://github.com/NikanEidi' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/nikan-eidi-03476232b' },
  { label: 'Email', href: 'mailto:nikaneydi1984@gmail.com' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-noir-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="font-mono text-xs text-noir-muted">© {new Date().getFullYear()} Nikan Eidi</p>
        <nav className="flex gap-6">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-1 -mx-1 font-mono text-xs uppercase tracking-wide text-noir-muted underline decoration-transparent underline-offset-4 transition-colors hover:bg-white/5 hover:text-accent-ice hover:decoration-accent-ice"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
