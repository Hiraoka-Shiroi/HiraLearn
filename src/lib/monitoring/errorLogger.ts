import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const detectBrowser = (ua: string): string => {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Unknown';
};

const detectOS = (ua: string): string => {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
};

interface ReportErrorOptions {
  /** Force-send even when running in development. Useful for tests. */
  force?: boolean;
}

/**
 * Persist a client-side error to Supabase `error_logs`.
 * No-ops in development unless `force` is set, and silently swallows failures
 * so the logger never causes a second error.
 */
export const reportError = async (
  err: unknown,
  opts: ReportErrorOptions = {},
): Promise<void> => {
  try {
    if (!opts.force && import.meta.env.DEV) return;
    if (!isSupabaseConfigured) return;
    if (typeof window === 'undefined') return;

    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
    const stack = err instanceof Error ? err.stack ?? null : null;
    const ua = window.navigator.userAgent || '';

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;

    await supabase.from('error_logs').insert({
      user_id: userId,
      error_message: message.slice(0, 2000),
      stack_trace: stack ? stack.slice(0, 8000) : null,
      browser: detectBrowser(ua),
      os: detectOS(ua),
      url: window.location.href,
      user_agent: ua.slice(0, 500),
    });
  } catch {
    // Never let the error logger throw.
  }
};

let installed = false;

/** Install global window.onerror + unhandledrejection handlers (idempotent). */
export const installGlobalErrorHandlers = (): void => {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const previousOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    void reportError(error ?? message);
    if (typeof previousOnError === 'function') {
      return previousOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    void reportError(event.reason ?? 'Unhandled promise rejection');
  });
};
