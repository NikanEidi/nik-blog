// Pulls a short, plain-text preview out of a note's raw Markdown — for the
// hover-preview panel on /notes, which needs a couple of lines, not the
// whole note. Skips a leading "# Title" line (notes/02 etc. often repeat
// the page title as their first line) and strips inline Markdown syntax
// (`code`, **bold**, *italic*, [links](url)) so the excerpt reads as plain
// text, not raw symbols.
export function excerptFromMarkdown(content: string, maxLength = 160): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const bodyLines = lines[0]?.startsWith('#') ? lines.slice(1) : lines;
  const firstParagraph = bodyLines.find((line) => !line.startsWith('#') && !line.startsWith('```'));

  if (!firstParagraph) return '';

  const plain = firstParagraph
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}…` : plain;
}
