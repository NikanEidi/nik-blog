'use client';

import { useEffect, useRef } from 'react';

// Deliberately not React state — updating state on every mousemove would
// re-render the whole tree dozens of times a second. Instead this writes
// directly to the DOM via a ref, which the browser handles far more
// cheaply (just a CSS transform), keeping the effect smooth without any
// animation library.
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = glowRef.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[100px]"
      style={{ background: 'var(--color-accent-ice)' }}
    />
  );
}
