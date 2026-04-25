import { create } from 'zustand';
import { LessonService } from '@/features/lessons/LessonService';

interface AppState {
  completedLessons: string[];
  xp: number;
  streak: number;
  currentLessonId: string | null;
  loading: boolean;

  // Actions
  fetchUserProgress: (userId: string) => Promise<void>;
  completeLesson: (userId: string, lessonId: string) => Promise<void>;
  addXP: (amount: number) => void;
  setCurrentLessonId: (id: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  completedLessons: [],
  xp: 0,
  streak: 0,
  currentLessonId: null,
  loading: false,

  fetchUserProgress: async (userId) => {
    set({ loading: true });
    try {
      const progress = await LessonService.getUserProgress(userId);
      const completedIds = progress.map(p => p.lesson_id).filter(id => id !== null) as string[];
      set({ completedLessons: completedIds });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      set({ loading: false });
    }
  },

  completeLesson: async (userId, lessonId) => {
    try {
      await LessonService.saveProgress(userId, lessonId);
      const { completedLessons } = get();
      if (!completedLessons.includes(lessonId)) {
        set({ completedLessons: [...completedLessons, lessonId] });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  },

  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),
  setCurrentLessonId: (id) => set({ currentLessonId: id }),
}));
