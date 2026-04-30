/**
 * A softly-blurred colour blob, used as a decorative accent behind
 * hero blocks. Declarative and purely presentational — no interaction.
 */

import React from 'react';

interface DecorBlobProps {
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  size?: number;
}

const colorMap: Record<NonNullable<DecorBlobProps['color']>, string> = {
  primary: 'var(--accent-primary)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const DecorBlob: React.FC<DecorBlobProps> = ({
  color = 'primary',
  className = '',
  size = 220,
}) => {
  return (
    <span
      aria-hidden
      className={`absolute rounded-full blur-[80px] opacity-25 pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colorMap[color]} 0%, transparent 70%)`,
      }}
    />
  );
};
