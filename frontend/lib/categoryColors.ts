// A note's category tag, a project's tech-stack chip, and related-content
// labels all render in one fixed accent color — copper — instead of the
// earlier per-category rainbow (dropped per feedback, 2026-10-15: the
// multi-color scheme read as too many accents competing at once, and a
// single consistent tag color reads calmer against the noir base).
export const TAG_ACCENT_COLOR = '#b5703f';

export function categoryColor(_category: string): string {
  return TAG_ACCENT_COLOR;
}
