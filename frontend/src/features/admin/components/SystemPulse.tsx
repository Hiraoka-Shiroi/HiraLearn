import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useLanguage } from '@/i18n/useLanguage';
import type { PulseBucket } from '../hooks/useAdminMetrics';

interface SystemPulseProps {
  buckets: PulseBucket[];
}

const formatHour = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
};

export const SystemPulse = ({ buckets }: SystemPulseProps) => {
  const { t } = useLanguage();
  const data = buckets.map((b) => ({ hour: formatHour(b.hour), avgMs: b.avgMs }));
  const empty = data.every((d) => d.avgMs === 0);

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold mb-1">{t('admin_system_pulse')} (24h)</h2>
          <p className="text-xs text-muted">{t('admin_system_pulse_hint')}</p>
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
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
              width={36}
              unit="ms"
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
            <Line
              type="monotone"
              dataKey="avgMs"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {empty ? (
        <p className="text-xs text-muted mt-4">{t('admin_no_metrics')}</p>
      ) : null}
    </div>
  );
};
