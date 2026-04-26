import { supabase } from '@/lib/supabase/client';

// Supabase RPC types are derived from generated DB types which we don't ship.
// Use a typed helper that bypasses the empty Functions table.
const rpc = supabase.rpc as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;
import type {
  AdminDashboardSummary,
  AdminLog,
  AdminUserRow,
  NotificationAudience,
  NotificationRecord,
  Role,
  AccountStatus,
  Subscription,
  SubscriptionPlan,
} from '@/types/database';

export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'last_seen_desc'
  | 'last_seen_asc'
  | 'email_asc'
  | 'email_desc';

export interface ListUsersParams {
  search?: string;
  role?: Role;
  status?: AccountStatus;
  plan?: SubscriptionPlan;
  onlyActiveSub?: boolean;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

export interface ListLogsParams {
  action?: string;
  adminId?: string;
  targetUserId?: string;
  limit?: number;
  offset?: number;
}

export type GrantDuration = '7d' | '30d' | '90d' | '365d' | 'forever';

const unwrap = <T>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('No data returned');
  return data;
};

export const adminService = {
  async listUsers(params: ListUsersParams = {}): Promise<AdminUserRow[]> {
    const { data, error } = await rpc('admin_list_users', {
      p_search: params.search ?? null,
      p_role: params.role ?? null,
      p_status: params.status ?? null,
      p_plan: params.plan ?? null,
      p_only_active_sub: params.onlyActiveSub ?? null,
      p_sort: params.sort ?? 'created_desc',
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminUserRow[];
  },

  async setUserRole(targetUserId: string, role: Role, reason?: string): Promise<void> {
    const { error } = await rpc('admin_set_user_role', {
      p_target_user: targetUserId,
      p_new_role: role,
      p_reason: reason ?? null,
    });
    if (error) throw new Error(error.message);
  },

  async setUserStatus(
    targetUserId: string,
    status: AccountStatus,
    reason?: string,
  ): Promise<void> {
    const { error } = await rpc('admin_set_user_status', {
      p_target_user: targetUserId,
      p_new_status: status,
      p_reason: reason ?? null,
    });
    if (error) throw new Error(error.message);
  },

  async grantSubscription(
    targetUserId: string,
    plan: SubscriptionPlan,
    duration: GrantDuration,
    reason?: string,
  ): Promise<Subscription> {
    const res = await rpc('admin_grant_subscription', {
      p_target_user: targetUserId,
      p_plan: plan,
      p_duration: duration,
      p_reason: reason ?? null,
    });
    return unwrap(res as { data: Subscription | null; error: { message: string } | null });
  },

  async revokeSubscription(targetUserId: string, reason?: string): Promise<void> {
    const { error } = await rpc('admin_revoke_subscription', {
      p_target_user: targetUserId,
      p_reason: reason ?? null,
    });
    if (error) throw new Error(error.message);
  },

  async expireSubscriptions(): Promise<number> {
    const { data, error } = await rpc('expire_subscriptions');
    if (error) throw new Error(error.message);
    return Number(data ?? 0);
  },

  async listLogs(params: ListLogsParams = {}): Promise<AdminLog[]> {
    const { data, error } = await rpc('admin_list_logs', {
      p_action: params.action ?? null,
      p_admin: params.adminId ?? null,
      p_target: params.targetUserId ?? null,
      p_limit: params.limit ?? 100,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminLog[];
  },

  async dashboardSummary(): Promise<AdminDashboardSummary> {
    const { data, error } = await rpc('admin_dashboard_summary');
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return row as AdminDashboardSummary;
  },

  async listNotifications(limit = 50): Promise<NotificationRecord[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as NotificationRecord[];
  },

  async sendPush(payload: {
    title: string;
    body: string;
    link?: string;
    audience: NotificationAudience;
  }): Promise<{
    audience_size: number;
    sent: number;
    failed: number;
    invalid_tokens: number;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: payload,
    });
    if (error) {
      // The Edge Function returns a JSON body even on non-2xx; surface the message.
      const msg =
        (data as { error?: string } | null)?.error ?? error.message ?? 'Push send failed';
      throw new Error(msg);
    }
    return data as {
      audience_size: number;
      sent: number;
      failed: number;
      invalid_tokens: number;
    };
  },
};
