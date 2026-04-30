import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

let recorded = false;

/**
 * Records initial page-load timing into `page_metrics` once per session.
 * No-ops in development.
 */
export const recordPageLoadMetric = (): void => {
  if (recorded) return;
  if (typeof window === 'undefined') return;
  if (import.meta.env.DEV) return;
  if (!isSupabaseConfigured) return;

  const send = () => {
    if (recorded) return;
    recorded = true;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (!nav) return;

      const loadTime = Math.round(nav.loadEventEnd - nav.startTime);
      const dcl = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      const ttfb = Math.round(nav.responseStart - nav.startTime);

      if (loadTime <= 0 || loadTime > 120_000) return;

      void supabase
        .from('page_metrics')
        .insert({
          url: window.location.pathname,
          load_time_ms: loadTime,
          dom_content_loaded_ms: dcl > 0 ? dcl : null,
          ttfb_ms: ttfb > 0 ? ttfb : null,
        })
        .then(() => {}, () => {});
    } catch {
      // ignore
    }
  };

  if (document.readyState === 'complete') {
    setTimeout(send, 0);
  } else {
    window.addEventListener('load', () => setTimeout(send, 0), { once: true });
  }
};
