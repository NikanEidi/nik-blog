'use client';

import { useEffect, useRef, useState, type ElementType } from 'react';

// Fires a brief glitch animation on a fixed interval instead of looping
// continuously — a glitch that never stops reads as broken, not stylish.
// Just one element, toggled with one class — a colored double text-shadow
// (chromatic aberration) plus a tiny jitter, animated via CSS keyframes.
// No extra DOM elements, no clip-path/positioning to get wrong.
export default function GlitchText({
  children,
  as: Tag = 'span',
  intervalMs = 5000,
  durationMs = 750,
}: {
  children: string;
  as?: ElementType;
  intervalMs?: number;
  durationMs?: number;
}) {
  const [glitching, setGlitching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      timeoutRef.current = setTimeout(() => setGlitching(false), durationMs);
    }, intervalMs);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [intervalMs, durationMs]);

  // Distance-based color blend toward the cursor glow, not a plain
  // :hover — the text starts tinting icy blue as the glow (CursorGlow.tsx)
  // approaches, not only once the cursor is exactly on top of it.
  //
  // The two colors are interpolated in plain JS and written straight to
  // el.style.color (same reasoning as CursorGlow: a value that changes on
  // every mousemove shouldn't trigger a React re-render). A first version
  // tried to do this blend with CSS color-mix() + calc() instead — Tailwind
  // v4's CSS engine (Lightning CSS) silently dropped that entire rule, so
  // the blend happens here in JS instead, where there's no CSS parser to
  // disagree with.
  useEffect(() => {
    const PROXIMITY_RADIUS = 260; // px — distance at which the tint starts
    const BASE = { r: 0xf2, g: 0xf0, b: 0xec }; // --color-noir-text
    const TINT = { r: 0x8e, g: 0xc5, b: 0xde }; // --color-accent-ice

    function handleMove(e: MouseEvent) {
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(e.clientX - cx, e.clientY - cy);
      const t = Math.max(0, 1 - distance / PROXIMITY_RADIUS);

      const r = Math.round(BASE.r + (TINT.r - BASE.r) * t);
      const g = Math.round(BASE.g + (TINT.g - BASE.g) * t);
      const b = Math.round(BASE.b + (TINT.b - BASE.b) * t);
      el.style.color = `rgb(${r}, ${g}, ${b})`;
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <Tag ref={elRef} className={glitching ? 'glitch-active' : ''} style={{ transition: 'color 0.15s ease-out' }}>
      {children}
    </Tag>
  );
}
