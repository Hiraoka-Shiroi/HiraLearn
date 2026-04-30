import React, { useEffect, useMemo, useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  /** Tailwind size class for the wrapper, e.g. "w-16 h-16" */
  sizeClass?: string;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Render a small status ring around the avatar. */
  ring?: boolean;
}

/**
 * Stable circular avatar with initials fallback. Uses object-cover so
 * portrait or landscape sources never stretch, and shows a soft
 * shimmer while the image is loading.
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  sizeClass = 'w-16 h-16',
  className = '',
  ring = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Reset loading/error state whenever the image source changes so a fresh
  // upload re-attempts to load even if a previous URL had errored out.
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || 'U';
  }, [name]);

  const showImage = !!src && !errored;

  return (
    <div
      className={`relative shrink-0 ${sizeClass} rounded-full overflow-hidden bg-accent-primary/10 border-2 ${
        ring ? 'border-accent-primary/30 shadow-glow-primary' : 'border-border'
      } ${className}`}
    >
      {showImage ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-accent-primary/10" />
          )}
          <img
            src={src!}
            alt={name ?? 'Avatar'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            draggable={false}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-accent-primary font-black select-none">
          <span className="text-[42%] leading-none">{initials}</span>
        </div>
      )}
    </div>
  );
};
