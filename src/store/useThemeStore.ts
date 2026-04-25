import { create } from 'zustand';

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan';

interface ThemeState {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}

const getSavedColor = (): ThemeColor => {
  try {
    const saved = localStorage.getItem('hiralearn-theme-color');
    if (saved && ['indigo', 'emerald', 'rose', 'amber', 'cyan'].includes(saved)) {
      return saved as ThemeColor;
    }
  } catch {
    // localStorage not available
  }
  return 'indigo';
};

export const useThemeStore = create<ThemeState>((set) => ({
  color: getSavedColor(),
  setColor: (color) => {
    try {
      localStorage.setItem('hiralearn-theme-color', color);
    } catch {
      // localStorage not available
    }
    document.documentElement.setAttribute('data-theme', color);
    set({ color });
  },
}));
