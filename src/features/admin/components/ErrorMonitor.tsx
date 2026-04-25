import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useLanguage } from '@/i18n/useLanguage';
import type { ErrorBucket } from '../hooks/useAdminMetrics';
import type { ErrorLog } from '@/types/database';

interface ErrorMonitorProps {
  buckets: ErrorBucket[];
  recent: ErrorLog[];
  loading: boolean;
}

const formatHour = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
};

export const ErrorMonitor = ({ buckets, recent, loading }: ErrorMonitorProps) => {
  const { t, language } = useLanguage();
  const data = buckets.map((b) => ({ hour: formatHour(b.hour), count: b.count }));
  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold mb-1">{t('admin_error_rate')}</h2>
          <p className="text-xs text-muted">&nbsp;</p>
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="errorFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                fontSize: 12,
              }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#errorFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
          {t('admin_recent_errors')}
        </h3>
        {loading ? (
          <p className="text-sm text-muted">{t('common_loading')}</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted">{t('admin_no_errors')}</p>
        ) : (
          <ul className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar pr-2">
            {recent.map((e) => (
              <li key={e.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-accent-danger truncate">
                      {e.error_message}
                    </p>
                    <p className="text-[11px] text-muted mt-1 truncate">
                      {e.url ?? '—'}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted whitespace-nowrap">
                    {formatTime(e.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
