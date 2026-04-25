import { create } from 'zustand';

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan';
export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  color: ThemeColor;
  mode: ThemeMode;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const COLOR_KEY = 'hiralearn-theme-color';
const MODE_KEY = 'hiralearn-theme-mode';

const getSavedColor = (): ThemeColor => {
  try {
    const saved = localStorage.getItem(COLOR_KEY);
    if (saved && ['indigo', 'emerald', 'rose', 'amber', 'cyan'].includes(saved)) {
      return saved as ThemeColor;
    }
  } catch {
    // localStorage not available
  }
  return 'indigo';
};

const getSavedMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage not available
  }
  return 'dark';
};

const applyMode = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme-mode', mode);
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const applyColor = (color: ThemeColor) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', color);
};

if (typeof document !== 'undefined') {
  applyMode(getSavedMode());
  applyColor(getSavedColor());
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  color: getSavedColor(),
  mode: getSavedMode(),
  setColor: (color) => {
    try {
      localStorage.setItem(COLOR_KEY, color);
    } catch {
      // localStorage not available
    }
    applyColor(color);
    set({ color });
  },
  setMode: (mode) => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // localStorage not available
    }
    applyMode(mode);
    set({ mode });
  },
  toggleMode: () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },
}));
