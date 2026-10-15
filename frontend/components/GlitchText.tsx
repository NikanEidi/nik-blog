'use client';

import { useEffect, useRef, useState, type ElementType } from 'react';
import { useProximityTint, textTint, backgroundTint, combineTints } from '@/lib/useProximityTint';

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

  // Distance-based color + background blend toward the cursor glow, not a
  // plain :hover — shares the same reusable hook as ReactiveText/DossierItem
  // (lib/useProximityTint.ts) instead of its own one-off mousemove logic.
  const elRef = useProximityTint<HTMLElement>(
    420,
    combineTints(textTint('#f2f0ec', '#8ec5de'), backgroundTint())
  );

  return (
    <Tag
      ref={elRef}
      className={`rounded ${glitching ? 'glitch-active' : ''}`}
      style={{ transition: 'color 0.15s ease-out, background-color 0.2s ease-out' }}
    >
      {children}
    </Tag>
  );
}
