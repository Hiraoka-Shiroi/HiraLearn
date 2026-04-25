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
  last_active_at: string | null;
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

export type ErrorLog = {
  id: string;
  user_id: string | null;
  error_message: string;
  stack_trace: string | null;
  browser: string | null;
  os: string | null;
  url: string | null;
  user_agent: string | null;
  created_at: string;
};

export type PageMetric = {
  id: string;
  user_id: string | null;
  url: string;
  load_time_ms: number;
  dom_content_loaded_ms: number | null;
  ttfb_ms: number | null;
  created_at: string;
};

export type SubscriptionPlan = 'student' | 'pro' | 'lifetime';
export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'expired';

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = 'completed' | 'refunded' | 'failed';

export type Payment = {
  id: string;
  user_id: string | null;
  subscription_id: string | null;
  provider: string;
  provider_event_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  role: 'student' | 'admin';
  level: number;
  xp: number;
  last_active_at: string | null;
  created_at: string;
  email: string;
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
      error_logs: TableDef<ErrorLog>;
      page_metrics: TableDef<PageMetric>;
      subscriptions: TableDef<Subscription>;
      payments: TableDef<Payment>;
    };
    Views: {
      admin_user_list: { Row: AdminUserRow; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
