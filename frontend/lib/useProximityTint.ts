'use client';

import { useEffect, useRef, type RefObject } from 'react';

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

// Generalized version of the proximity-tint logic first built for
// GlitchText (notes/10) — any element can react to the cursor glow
// getting physically closer, not just the homepage headline. Still
// writes straight to element.style instead of a CSS custom property,
// since Lightning CSS (Tailwind v4's CSS engine) silently dropped a
// color-mix()-based version of this (see notes/10 for the full story).
//
// `apply` decides *what* changes with proximity — a text color, a
// border color, anything — so this one hook covers text, borders, and
// "frame" colors alike without duplicating the mousemove/distance math
// in every component that wants to react.
export function useProximityTint<T extends HTMLElement>(
  radius: number,
  apply: (el: T, t: number) => void
): RefObject<T | null> {
  const elRef = useRef<T | null>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Distance to the nearest point on the element's box, not its
      // center — using the center made large elements (a multi-line
      // paragraph, a wide grid cell) require the cursor to be almost
      // exactly in the middle before reacting at all. This is 0 the
      // moment the cursor is anywhere inside the box.
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const distance = Math.hypot(dx, dy);
      const t = Math.max(0, 1 - distance / radius);
      apply(el, t);
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [radius, apply]);

  return elRef;
}

// Ready-made "apply" for the common case: blend a text color from a base
// hex toward a tint hex as proximity (0–1) increases.
export function textTint(baseHex: string, tintHex: string) {
  const base = hexToRgb(baseHex);
  const tint = hexToRgb(tintHex);
  return (el: HTMLElement, t: number) => {
    const r = lerp(base.r, tint.r, t);
    const g = lerp(base.g, tint.g, t);
    const b = lerp(base.b, tint.b, t);
    el.style.color = `rgb(${r}, ${g}, ${b})`;
  };
}

// Ready-made "apply" for a border/frame color brightening toward the tint.
export function borderTint(baseHex: string, tintHex: string) {
  const base = hexToRgb(baseHex);
  const tint = hexToRgb(tintHex);
  return (el: HTMLElement, t: number) => {
    const r = lerp(base.r, tint.r, t);
    const g = lerp(base.g, tint.g, t);
    const b = lerp(base.b, tint.b, t);
    el.style.borderTopColor = `rgb(${r}, ${g}, ${b})`;
  };
}

// A soft white wash behind an element, growing with proximity — "the
// section goes white" as the glow nears it, not just the text/border.
// Capped low (0.09 alpha max) so it reads as a highlight, not a flash.
export function backgroundTint(maxAlpha = 0.09) {
  return (el: HTMLElement, t: number) => {
    el.style.backgroundColor = `rgba(255, 255, 255, ${(t * maxAlpha).toFixed(3)})`;
  };
}

// Combine multiple "apply" functions into one (e.g. text + background
// tinting on the same element) without each needing its own listener.
export function combineTints(...fns: Array<(el: HTMLElement, t: number) => void>) {
  return (el: HTMLElement, t: number) => fns.forEach((fn) => fn(el, t));
}
