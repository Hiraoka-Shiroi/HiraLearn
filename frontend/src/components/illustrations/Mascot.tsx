/**
 * Inline SVG mascot for HiraLearn ("Hira").
 *
 * Rendered as pure SVG (no external assets, keeps the APK bundle small
 * and survives offline). Colours come from the current accent theme via
 * `var(--accent-primary)` so the mascot adapts to every theme skin.
 *
 * Variants:
 *  - `wave`: default, waving greeting (used on the dashboard hero).
 *  - `study`: reading a book (used for empty states / profile hero).
 *  - `celebrate`: arms up (used for achievements / streak milestones).
 */

import React from 'react';

interface MascotProps {
  /** Visual pose. */
  variant?: 'wave' | 'study' | 'celebrate';
  /** Tailwind size class, e.g. `w-24 h-24`. Defaults to `w-24 h-24`. */
  sizeClass?: string;
  className?: string;
  /** If true, renders a soft glow halo behind the mascot. */
  glow?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({
  variant = 'wave',
  sizeClass = 'w-24 h-24',
  className = '',
  glow = false,
}) => {
  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full blur-2xl opacity-50"
          style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 65%)' }}
        />
      )}
      <svg
        viewBox="0 0 160 160"
        className="relative w-full h-full"
        role="img"
        aria-label="HiraLearn mascot"
      >
        {/* Body blob */}
        <defs>
          <linearGradient id="hira-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.72" />
          </linearGradient>
          <radialGradient id="hira-cheek" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ff7a8a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff7a8a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* main egg/blob shape */}
        <ellipse cx="80" cy="92" rx="52" ry="54" fill="url(#hira-body)" />

        {/* shine highlight */}
        <ellipse cx="60" cy="62" rx="18" ry="11" fill="#fff" opacity="0.22" />

        {/* cheeks */}
        <circle cx="52" cy="100" r="10" fill="url(#hira-cheek)" />
        <circle cx="108" cy="100" r="10" fill="url(#hira-cheek)" />

        {/* eyes */}
        {variant === 'celebrate' ? (
          <>
            {/* happy arcs */}
            <path d="M56 88 Q64 78 72 88" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M88 88 Q96 78 104 88" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <circle cx="64" cy="90" r="6" fill="#0f172a" />
            <circle cx="96" cy="90" r="6" fill="#0f172a" />
            {/* sparkle in eyes */}
            <circle cx="66" cy="88" r="1.8" fill="#fff" />
            <circle cx="98" cy="88" r="1.8" fill="#fff" />
          </>
        )}

        {/* mouth */}
        {variant === 'celebrate' ? (
          <path d="M68 112 Q80 126 92 112" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="#0f172a" fillOpacity="0.15" />
        ) : (
          <path d="M72 110 Q80 118 88 110" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {/* antenna / hair tuft on top */}
        <path d="M80 40 Q82 28 90 26" stroke="var(--accent-primary)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="92" cy="24" r="5" fill="var(--accent-primary)" />

        {/* arms */}
        {variant === 'wave' && (
          <>
            <path d="M32 104 Q18 78 32 62" stroke="var(--accent-primary)" strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M128 104 Q142 94 146 78" stroke="var(--accent-primary)" strokeWidth="9" strokeLinecap="round" fill="none" />
            <circle cx="32" cy="60" r="7" fill="var(--accent-primary)" />
            <circle cx="148" cy="76" r="7" fill="var(--accent-primary)" />
          </>
        )}
        {variant === 'celebrate' && (
          <>
            <path d="M34 96 Q22 58 40 40" stroke="var(--accent-primary)" strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M126 96 Q138 58 120 40" stroke="var(--accent-primary)" strokeWidth="9" strokeLinecap="round" fill="none" />
            <circle cx="42" cy="38" r="7" fill="var(--accent-primary)" />
            <circle cx="118" cy="38" r="7" fill="var(--accent-primary)" />
          </>
        )}
        {variant === 'study' && (
          <>
            {/* open book in hands */}
            <path d="M38 116 L80 110 L122 116 L122 134 L80 128 L38 134 Z" fill="#fff" opacity="0.95" />
            <path d="M80 110 L80 128" stroke="var(--accent-primary)" strokeWidth="2" />
            <path d="M46 120 L74 116 M46 126 L74 122 M86 116 L114 120 M86 122 L114 126"
                  stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
            <path d="M40 108 Q30 106 34 100" stroke="var(--accent-primary)" strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M120 108 Q130 106 126 100" stroke="var(--accent-primary)" strokeWidth="9" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* code ligature "<>" on belly for flavour */}
        <text
          x="80" y="104"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fontWeight="700"
          fill="#fff"
          opacity="0.35"
          style={{ userSelect: 'none' }}
        >
          &lt;/&gt;
        </text>
      </svg>
    </div>
  );
};
