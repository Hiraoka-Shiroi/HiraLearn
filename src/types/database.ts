export type Role = 'user' | 'moderator' | 'admin' | 'super_admin';
export type AccountStatus = 'active' | 'banned' | 'deleted';

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: Role;
  status: AccountStatus;
  level: number;
  xp: number;
  streak: number;
  current_goal: string;
  daily_minutes: number;
  explanation_style: string;
  last_active_at: string | null;
  last_seen_at: string | null;
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

export type SubscriptionPlan = 'free' | 'student' | 'premium' | 'pro' | 'lifetime';
export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_end: string | null;
  starts_at: string | null;
  ends_at: string | null;
  issued_by: string | null;
  reason: string | null;
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
  email: string;
  role: Role;
  status: AccountStatus;
  level: number;
  xp: number;
  last_seen_at: string | null;
  created_at: string;
  plan: SubscriptionPlan | null;
  plan_active: boolean;
  plan_ends_at: string | null;
  total_count: number;
};

export type PushPlatform = 'web' | 'ios' | 'android';

export type PushToken = {
  id: string;
  user_id: string;
  token: string;
  platform: PushPlatform;
  device_info: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminAction =
  | 'role.change'
  | 'status.change'
  | 'subscription.grant'
  | 'subscription.revoke'
  | 'push.send'
  | string;

export type AdminLog = {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  admin_name: string | null;
  target_user_id: string | null;
  target_email: string | null;
  target_name: string | null;
  action: AdminAction;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  total_count: number;
};

export type NotificationAudience =
  | { type: 'all' }
  | { type: 'role'; value: Role }
  | { type: 'plan'; value: SubscriptionPlan }
  | { type: 'user'; value: string };

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  audience: NotificationAudience;
  sent_by: string | null;
  sent_count: number;
  failed_count: number;
  invalid_tokens: string[] | null;
  created_at: string;
};

export type AdminDashboardSummary = {
  total_users: number;
  active_users_30d: number;
  banned_users: number;
  active_subscriptions: number;
  total_revenue: number;
  push_tokens_active: number;
  notifications_sent_30d: number;
  errors_24h: number;
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
      push_tokens: TableDef<PushToken>;
      admin_logs: TableDef<AdminLog>;
      notifications: TableDef<NotificationRecord>;
    };
    Views: {
      admin_user_list: { Row: AdminUserRow; Relationships: [] };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
