import type { Note } from '@/lib/api';

// A numbered series title ("07: Full RAG") should read in that order, not
// the API's pinned/recency order — notes often get edited well after the
// series was written, which scrambles 01..08 into whatever order they were
// last touched. Titles with no leading number sort after any numbered ones.
export function leadingNumber(title: string): number {
  const match = /^(\d+)\s*[-.:—–]/.exec(title.trim());
  return match ? Number(match[1]) : Infinity;
}

export function sortByLeadingNumber(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => leadingNumber(a.title) - leadingNumber(b.title));
}
