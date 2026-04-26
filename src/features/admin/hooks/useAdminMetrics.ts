import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ErrorLog, PageMetric, AdminUserRow } from '@/types/database';

export interface AdminSummary {
  totalUsers: number;
  totalRevenue: number;
  errorsLast24h: number;
  avgLoadMs: number | null;
  visitorsToday: number;
}

export interface ErrorBucket {
  hour: string; // ISO hour bucket
  count: number;
}

export interface PulseBucket {
  hour: string;
  avgMs: number;
}

interface AdminMetricsState {
  summary: AdminSummary | null;
  errorBuckets: ErrorBucket[];
  pulseBuckets: PulseBucket[];
  recentErrors: ErrorLog[];
  users: AdminUserRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const startOfHour = (d: Date): Date => {
  const c = new Date(d);
  c.setMinutes(0, 0, 0);
  return c;
};

const last24HourBuckets = (): string[] => {
  const out: string[] = [];
  const now = startOfHour(new Date());
  for (let i = 23; i >= 0; i--) {
    out.push(new Date(now.getTime() - i * 3_600_000).toISOString());
  }
  return out;
};

const bucketKey = (iso: string): string => {
  const d = new Date(iso);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

export const useAdminMetrics = (): AdminMetricsState => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [errorBuckets, setErrorBuckets] = useState<ErrorBucket[]>([]);
  const [pulseBuckets, setPulseBuckets] = useState<PulseBucket[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

      const [
        usersCountRes,
        revenueRes,
        errorsCountRes,
        recentErrorsRes,
        errorsRangeRes,
        pulseRes,
        userListRes,
        visitorsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since24h),
        supabase
          .from('error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('error_logs')
          .select('created_at')
          .gte('created_at', since24h),
        supabase
          .from('page_metrics')
          .select('created_at, load_time_ms')
          .gte('created_at', since24h),
        supabase
          .from('admin_user_list')
          .select('*')
          .order('last_active_at', { ascending: false, nullsFirst: false })
          .limit(100),
        supabase
          .from('page_metrics')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since24h),
      ]);

      // Fallback: if admin_user_list view doesn't exist or returns empty, query profiles directly
      let userRows: AdminUserRow[] = (userListRes.data as AdminUserRow[]) ?? [];
      if (userListRes.error || userRows.length === 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, username, full_name, role, level, xp, last_active_at, created_at')
          .order('last_active_at', { ascending: false, nullsFirst: false })
          .limit(100);
        if (profileRows && profileRows.length > 0) {
          userRows = profileRows.map((p) => ({ ...p, email: p.username || '' })) as AdminUserRow[];
        }
      }

      const totalRevenue =
        revenueRes.data?.reduce(
          (acc: number, row: { amount: number | string | null }) =>
            acc + (Number(row.amount) || 0),
          0,
        ) ?? 0;

      const errorBucketsMap = new Map<string, number>();
      last24HourBuckets().forEach((h) => errorBucketsMap.set(h, 0));
      (errorsRangeRes.data ?? []).forEach((row: { created_at: string }) => {
        const k = bucketKey(row.created_at);
        if (errorBucketsMap.has(k)) {
          errorBucketsMap.set(k, (errorBucketsMap.get(k) ?? 0) + 1);
        }
      });

      const pulseAccumulator = new Map<string, { sum: number; count: number }>();
      last24HourBuckets().forEach((h) => pulseAccumulator.set(h, { sum: 0, count: 0 }));
      (pulseRes.data ?? []).forEach(
        (row: Pick<PageMetric, 'created_at' | 'load_time_ms'>) => {
          const k = bucketKey(row.created_at);
          const cur = pulseAccumulator.get(k);
          if (cur) {
            cur.sum += row.load_time_ms;
            cur.count += 1;
          }
        },
      );

      const allMs = (pulseRes.data ?? []).map(
        (r: Pick<PageMetric, 'load_time_ms'>) => r.load_time_ms,
      );
      const avgLoadMs =
        allMs.length > 0
          ? Math.round(allMs.reduce((a: number, b: number) => a + b, 0) / allMs.length)
          : null;

      setSummary({
        totalUsers: usersCountRes.count ?? 0,
        totalRevenue,
        errorsLast24h: errorsCountRes.count ?? 0,
        avgLoadMs,
        visitorsToday: visitorsRes.count ?? 0,
      });
      setErrorBuckets(
        Array.from(errorBucketsMap.entries()).map(([hour, count]) => ({ hour, count })),
      );
      setPulseBuckets(
        Array.from(pulseAccumulator.entries()).map(([hour, { sum, count }]) => ({
          hour,
          avgMs: count > 0 ? Math.round(sum / count) : 0,
        })),
      );
      setRecentErrors((recentErrorsRes.data as ErrorLog[]) ?? []);
      setUsers(userRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    summary,
    errorBuckets,
    pulseBuckets,
    recentErrors,
    users,
    loading,
    error,
    refresh: load,
  };
};
