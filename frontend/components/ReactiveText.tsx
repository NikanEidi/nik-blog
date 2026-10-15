'use client';

import type { ElementType } from 'react';
import { useProximityTint, textTint, backgroundTint, combineTints } from '@/lib/useProximityTint';

const NOIR_TEXT = '#f2f0ec';
const NOIR_MUTED = '#8a8a86';
const ACCENT_ICE = '#8ec5de';

export default function ReactiveText({
  children,
  as: Tag = 'span',
  muted = false,
  radius = 450,
  className = '',
}: {
  children: React.ReactNode;
  as?: ElementType;
  muted?: boolean;
  radius?: number;
  className?: string;
}) {
  const ref = useProximityTint<HTMLElement>(
    radius,
    combineTints(textTint(muted ? NOIR_MUTED : NOIR_TEXT, ACCENT_ICE), backgroundTint())
  );

  return (
    <Tag ref={ref} className={`rounded ${className}`} style={{ transition: 'color 0.2s ease-out, background-color 0.2s ease-out' }}>
      {children}
    </Tag>
  );
}
