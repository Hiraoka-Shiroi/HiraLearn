/**
 * Supabase data-access services.
 *
 * `contentCardService` — read-only queries for courses / modules / lessons / tasks.
 * `progressService`    — user progress & lesson completion (via `complete_lesson` RPC).
 * `profileService`     — safe profile field updates (via `update_own_profile` RPC).
 *
 * All write operations go through SECURITY DEFINER RPCs so that the client
 * cannot tamper with XP, level, streak, or role. See also the
 * `profiles_protect_columns` trigger in the 20260430 migration.
 */

import { supabase } from './client';
import { Course, Module, Lesson, Task, UserProgress, Profile } from '@/types/database';

// TODO: migrate completeLesson flow to a single Supabase RPC that also
//       validates task answers server-side (currently validation is client-only).

export const contentCardService = {
  async getCourses() {
    // Try to order by the new `order_index` column first; fall back to
    // `created_at` for older databases that haven't applied the
    // 20260430 migration yet.
    let { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error && /column .*order_index/i.test(error.message)) {
      const fallback = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    return (data ?? []) as Course[];
  },

  async getModules(courseId: string) {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index');
    if (error) throw error;
    return data as Module[];
  },

  async getLessons(moduleId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .eq('is_published', true)
      .order('order_index');
    if (error) throw error;
    return data as Lesson[];
  },

  async getLessonWithTasks(lessonId: string) {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*, tasks(*)')
      .eq('id', lessonId)
      .single();

    if (lessonError) throw lessonError;
    return lesson as unknown as Lesson & { tasks: Task[] };
  }
};

export interface CompleteLessonResult {
  /** The fresh profile after XP/level/streak update. */
  profile: Profile;
  /** XP awarded by *this* call (0 if the lesson was already completed). */
  xpAwarded: number;
  /** True if the call moved the user to a higher level. */
  leveledUp: boolean;
  /** Level number BEFORE this completion. */
  previousLevel: number;
}

export const progressService = {
  async getUserProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data as UserProgress[];
  },

  /**
   * Complete a lesson via the SECURITY DEFINER `complete_lesson` RPC.
   * The RPC awards XP, recomputes level, updates the streak, and returns
   * the updated profile atomically. Clients cannot bump XP/level
   * directly — the profiles_protect_columns trigger reverts any raw
   * UPDATEs from `authenticated` to OLD values.
   */
  async completeLesson(lessonId: string, currentProfile: Profile | null): Promise<CompleteLessonResult> {
    const { data, error } = await supabase.rpc('complete_lesson', { p_lesson_id: lessonId });
    if (error) throw error;

    // RPC returns the profile row; supabase-js wraps a single-record
    // RETURNS public.profiles into an object (not an array).
    const profile = (Array.isArray(data) ? data[0] : data) as Profile;
    if (!profile) throw new Error('complete_lesson returned no profile');

    const previousXp = currentProfile?.xp ?? 0;
    const previousLevel = currentProfile?.level ?? 1;
    const xpAwarded = Math.max(0, (profile.xp ?? 0) - previousXp);
    const leveledUp = (profile.level ?? 1) > previousLevel;

    return { profile, xpAwarded, leveledUp, previousLevel };
  },
};

export const profileService = {
  /**
   * Update only the safe profile fields via the `update_own_profile` RPC.
   * Pass `null` for fields you don't want to touch; pass `''` to clear.
   */
  async updateOwnProfile(input: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    current_goal?: string | null;
    daily_minutes?: number | null;
    explanation_style?: string | null;
  }): Promise<Profile> {
    const { data, error } = await supabase.rpc('update_own_profile', {
      p_full_name:         input.full_name ?? null,
      p_username:          input.username ?? null,
      p_avatar_url:        input.avatar_url ?? null,
      p_current_goal:      input.current_goal ?? null,
      p_daily_minutes:     input.daily_minutes ?? null,
      p_explanation_style: input.explanation_style ?? null,
    });
    if (error) throw error;

    const profile = (Array.isArray(data) ? data[0] : data) as Profile;
    if (!profile) throw new Error('update_own_profile returned no profile');
    return profile;
  },
};
