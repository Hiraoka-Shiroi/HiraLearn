
import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true, // App.tsx will set this to false
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, loading: false }),
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error (likely storage access):", e);
    }
    set({ user: null, profile: null, loading: false });
  },
}));
