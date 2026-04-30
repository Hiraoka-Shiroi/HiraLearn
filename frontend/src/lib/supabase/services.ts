
import { supabase } from './client';
import { Course, Module, Lesson, Task, UserProgress } from '@/types/database';

export const contentCardService = {
  async getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at');
    if (error) throw error;
    return data as Course[];
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
    return lesson as Lesson & { tasks: Task[] };
  }
};

function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  return 10;
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

  async completeLesson(userId: string, lessonId: string, xpReward: number) {
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existing) {
      return;
    }

    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

    if (progressError) throw progressError;

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, streak')
      .eq('id', userId)
      .single();

    if (profile) {
      const newXp = profile.xp + xpReward;
      const newLevel = calculateLevel(newXp);

      // Compute streak from user_progress completion dates (not last_active_at
      // which App.tsx updates on every page load).
      const today = new Date().toISOString().slice(0, 10);

      const { data: prevCompletions } = await supabase
        .from('user_progress')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .neq('lesson_id', lessonId)
        .order('completed_at', { ascending: false })
        .limit(1);

      let newStreak = profile.streak ?? 0;
      const lastCompletionDate = prevCompletions?.[0]?.completed_at
        ? new Date(prevCompletions[0].completed_at).toISOString().slice(0, 10)
        : null;

      if (lastCompletionDate === today) {
        // already completed another lesson today, keep streak
      } else if (lastCompletionDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        newStreak = lastCompletionDate === yesterdayStr ? newStreak + 1 : 1;
      } else {
        newStreak = 1;
      }

      await supabase
        .from('profiles')
        .update({
          xp: newXp,
          level: newLevel,
          streak: newStreak,
        })
        .eq('id', userId);
    }
  }
};
