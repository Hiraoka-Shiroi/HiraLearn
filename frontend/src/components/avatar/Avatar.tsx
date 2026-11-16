import React, { useEffect, useMemo, useRef, useState } from 'react';

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
 * Stable circular avatar with initials fallback.
 *
 * Behaviour that fixes the "flash of initials on login":
 *  - While a `src` exists but the image hasn't loaded yet, we render an
 *    animated skeleton shimmer — NOT initials — so the circle never
 *    briefly shows a letter while Supabase Storage is slow.
 *  - If the first load attempt errors (transient network / CDN blip),
 *    we retry once automatically with a cache-busting query param before
 *    giving up and falling back to initials.
 *  - Image is eagerly preloaded via `new Image()` so it's in the cache
 *    by the time it paints.
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
  const [retrySrc, setRetrySrc] = useState<string | null>(null);
  const retriedRef = useRef(false);

  // Reset loading/error state whenever the image source changes so a fresh
  // upload re-attempts to load even if a previous URL had errored out.
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    setRetrySrc(null);
    retriedRef.current = false;
  }, [src]);

  // Eager preload: kick off the fetch before React even commits the <img>.
  useEffect(() => {
    if (!src) return;
    const preloader = new Image();
    preloader.decoding = 'async';
    preloader.src = src;
  }, [src]);

  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || 'U';
  }, [name]);

  const effectiveSrc = retrySrc ?? src ?? undefined;
  const hasSource = !!src;
  // Show initials only when there is genuinely no source, or after both
  // load attempts have failed. While loading we show the skeleton instead.
  const showInitials = !hasSource || (errored && !retrySrc);

  const handleError = () => {
    // One automatic retry with a cache-buster, then give up.
    if (!retriedRef.current && src) {
      retriedRef.current = true;
      const sep = src.includes('?') ? '&' : '?';
      setRetrySrc(`${src}${sep}r=${Date.now()}`);
      return;
    }
    // Retry also failed — clear the retry source so we fall back to initials.
    setRetrySrc(null);
    setErrored(true);
  };

  return (
    <div
      className={`relative shrink-0 ${sizeClass} rounded-full overflow-hidden bg-accent-primary/10 border-2 ${
        ring ? 'border-accent-primary/30 shadow-glow-primary' : 'border-border'
      } ${className}`}
    >
      {hasSource && !showInitials ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-avatar-skeleton bg-gradient-to-br from-accent-primary/20 via-surface-2 to-accent-primary/10" />
          )}
          <img
            src={effectiveSrc}
            alt={name ?? 'Avatar'}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            draggable={false}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-accent-primary font-black select-none bg-gradient-to-br from-accent-primary/15 to-accent-primary/5">
          <span className="text-[42%] leading-none">{initials}</span>
        </div>
      )}
    </div>
  );
};
