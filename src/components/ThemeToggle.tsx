import { useThemeStore, ThemeColor } from '@/store/useThemeStore';
import { Palette } from 'lucide-react';
import { useState } from 'react';

const colors: { id: ThemeColor; label: string; class: string }[] = [
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
];

export const ThemeToggle = () => {
  const { color, setColor } = useThemeStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Theme color"
        className="w-10 h-10 rounded-full bg-card border border-border hover:border-accent-primary/50 transition-all flex items-center justify-center text-foreground"
      >
        <Palette size={16} className="text-accent-primary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-2xl p-3 shadow-2xl flex gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => { setColor(c.id); setOpen(false); }}
                className={`w-8 h-8 rounded-full ${c.class} transition-all hover:scale-110 ${
                  color === c.id ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : ''
                }`}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
