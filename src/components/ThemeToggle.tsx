import { useThemeStore, ThemeColor } from '@/store/useThemeStore';
import { Palette } from 'lucide-react';
import { useState } from 'react';

const colors: { id: ThemeColor; label: string; class: string }[] = [
  { id: 'indigo', label: 'Индиго', class: 'bg-indigo-500' },
  { id: 'emerald', label: 'Изумруд', class: 'bg-emerald-500' },
  { id: 'rose', label: 'Роза', class: 'bg-rose-500' },
  { id: 'amber', label: 'Янтарь', class: 'bg-amber-500' },
  { id: 'cyan', label: 'Циан', class: 'bg-cyan-500' },
];

export const ThemeToggle = () => {
  const { color, setColor } = useThemeStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-accent-primary/50 transition-all text-sm font-bold"
        title="Цвет темы"
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
                  color === c.id ? 'ring-2 ring-offset-2 ring-offset-card ring-white scale-110' : ''
                }`}
                title={c.label}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
