import { useMemo } from 'react';

export const useToast = () => {
  return useMemo(() => {
    const show = (kind: 'success' | 'error' | 'info', message: string) => {
      window.dispatchEvent(
        new CustomEvent('hiralearn:toast', { detail: { kind, message } }),
      );
    };
    return {
      success: (msg: string) => show('success', msg),
      error: (msg: string) => show('error', msg),
      info: (msg: string) => show('info', msg),
    };
  }, []);
};
