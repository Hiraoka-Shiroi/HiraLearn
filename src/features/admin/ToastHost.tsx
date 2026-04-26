import { useEffect, useState } from 'react';
import { Toast } from './ui';

interface ToastItem {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

export const ToastHost = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let counter = 0;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: ToastItem['kind']; message: string }>).detail;
      if (!detail) return;
      counter += 1;
      const id = counter;
      setItems((prev) => [...prev, { id, kind: detail.kind, message: detail.message }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener('hiralearn:toast', handler);
    return () => window.removeEventListener('hiralearn:toast', handler);
  }, []);

  return (
    <div className="pointer-events-none">
      {items.map((t, idx) => (
        <div
          key={t.id}
          style={{ position: 'fixed', right: 24, bottom: 24 + idx * 70, zIndex: 60 }}
          className="pointer-events-auto"
        >
          <Toast
            kind={t.kind}
            message={t.message}
            onClose={() => setItems((prev) => prev.filter((it) => it.id !== t.id))}
          />
        </div>
      ))}
    </div>
  );
};
