// Plain-text preview from a note's Markdown: skips a leading "# Title"
// line and strips inline syntax (code, bold, italic, links).
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
