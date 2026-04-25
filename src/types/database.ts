export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'student' | 'admin';
  level: number;
  xp: number;
  streak: number;
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
  level: string;
  is_published: boolean;
  created_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  theory: string;
  example_code: string;
  order_index: number;
  xp_reward: number;
  is_published: boolean;
  created_at: string;
};

export type Task = {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  task_type: string;
  starter_code: string;
  expected_solution: string;
  validation_rules: Record<string, string[]>;
  hints: string[];
  xp_reward: number;
  order_index: number;
  created_at: string;
};

export type UserProgress = {
  user_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed';
  completed_at: string | null;
};

export type SubscriptionPlan = 'free' | 'student' | 'pro' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  payment_method: string;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
};

type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      courses: TableDef<Course>;
      modules: TableDef<Module>;
      lessons: TableDef<Lesson>;
      tasks: TableDef<Task>;
      user_progress: TableDef<UserProgress>;
      subscriptions: TableDef<Subscription>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
