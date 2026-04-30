/**
 * Small decorative badges for course / module cards. Pure SVG, themed
 * via `var(--accent-primary)`. `kind` is matched case-insensitively
 * against common course topics; falls back to a generic spark.
 */

import React from 'react';

interface CourseBadgeProps {
  kind?: string | null;
  sizeClass?: string;
  className?: string;
}

const norm = (s: string) => s.toLowerCase();

export const CourseBadge: React.FC<CourseBadgeProps> = ({
  kind,
  sizeClass = 'w-10 h-10',
  className = '',
}) => {
  const k = kind ? norm(kind) : '';

  let label = '<>';
  let color = 'var(--accent-primary)';
  if (k.includes('html')) { label = 'H'; color = '#ef4444'; }
  else if (k.includes('css')) { label = 'C'; color = '#3b82f6'; }
  else if (k.includes('flex')) { label = 'F'; color = '#10b981'; }
  else if (k.includes('javascript') || k.includes('js')) { label = 'JS'; color = '#f59e0b'; }
  else if (k.includes('react')) { label = 'R'; color = '#06b6d4'; }
  else if (k.includes('typescript') || k.includes('ts')) { label = 'TS'; color = '#6366f1'; }
  else if (k.includes('git')) { label = 'G'; color = '#f97316'; }
  else if (k.includes('проект') || k.includes('project')) { label = '★'; color = '#a855f7'; }

  return (
    <div
      className={`${sizeClass} ${className} rounded-xl flex items-center justify-center font-black text-sm shrink-0 relative overflow-hidden`}
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden
    >
      <span
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(circle at 30% 20%, ${color} 0%, transparent 60%)` }}
      />
      <span className="relative">{label}</span>
    </div>
  );
};
