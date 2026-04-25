
export type Database = any; // For backward compatibility with existing files

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'admin';
  level: number;
  xp: number;
  current_goal: string;
  daily_minutes: number;
  explanation_style: string;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  is_published: boolean;
  created_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  is_published: boolean;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  theory: string;
  order_index: number;
  xp_reward: number;
  is_published: boolean;
};

export type Task = {
  id: string;
  lesson_id: string;
  description: string;
  starter_code: string;
  validation_rules: any;
  xp_reward: number;
  order_index: number;
};

export type UserProgress = {
  user_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed';
  completed_at: string | null;
};
