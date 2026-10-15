// Maps a note's category to its accent color (DESIGN.md — "Note category
// color map"). Centralized here so the mapping is defined once, not
// re-typed in every component that renders a category-colored element.
//
// Stored as hex, not `var(--color-...)`, on purpose: DossierItem's border
// proximity-tint needs the real numeric value to interpolate in JS (see
// notes/10 — CSS-side color blending turned out unreliable with this
// project's CSS engine), and a hex string works identically to a CSS
// variable anywhere it's just assigned to a `color`/`style` property.
export const CATEGORY_COLORS: Record<string, string> = {
  'ai-ml': '#2dd9c4',
  backend: '#8ec5de', // blue — swapped from the original copper/orange pick
  infrastructure: '#b5703f', // copper now lives here instead
  ios: '#9b8cd6',
  dsa: '#d97a5c',
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#8a8a86';
}
