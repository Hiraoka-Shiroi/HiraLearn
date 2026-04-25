import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type UserProgress = Database['public']['Tables']['user_progress']['Row'];

export const LessonService = {
  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true);
    if (error) throw error;
    return (data as any) || [];
  },

  async getModules(courseId: string): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index');
    if (error) throw error;
    return (data as any) || [];
  },

  async getLessons(moduleId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .eq('is_published', true)
      .order('order_index');
    if (error) throw error;
    return (data as any) || [];
  },

  async getLessonTasks(lessonId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index');
    if (error) throw error;
    return (data as any) || [];
  },

  async saveProgress(userId: string, lessonId: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id, lesson_id' });
    if (error) throw error;
    return data;
  },

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data as any) || [];
  }
};
