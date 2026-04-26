
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
    // Check if lesson was already completed to prevent duplicate XP
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existing) {
      // Already completed — skip XP award
      return;
    }

    // Mark lesson as completed
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

    if (progressError) throw progressError;

    // Update user XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ xp: profile.xp + xpReward })
        .eq('id', userId);
    }
  }
};
