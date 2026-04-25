import { Users, Wallet, Activity, AlertTriangle } from 'lucide-react';
import { StatCard } from './StatCard';
import { useLanguage } from '@/i18n/useLanguage';
import type { AdminSummary } from '../hooks/useAdminMetrics';

interface AdminStatsProps {
  summary: AdminSummary | null;
  loading: boolean;
}

const numberFormatter = new Intl.NumberFormat('ru-RU');

export const AdminStats = ({ summary, loading }: AdminStatsProps) => {
  const { t } = useLanguage();
  const cards = [
    {
      label: t('admin_total_users'),
      value: loading || !summary ? '—' : summary.totalUsers.toLocaleString('ru-RU'),
      icon: <Users size={18} />,
      accent: 'primary' as const,
    },
    {
      label: t('admin_revenue'),
      value:
        loading || !summary
          ? '—'
          : `${numberFormatter.format(Math.round(summary.totalRevenue))} ₸`,
      icon: <Wallet size={18} />,
      accent: 'success' as const,
    },
    {
      label: t('admin_system_pulse'),
      value:
        loading || !summary
          ? '—'
          : summary.avgLoadMs !== null
            ? `${summary.avgLoadMs} ms`
            : '—',
      hint: t('admin_system_pulse_hint'),
      icon: <Activity size={18} />,
      accent: 'primary' as const,
    },
    {
      label: t('admin_error_rate'),
      value: loading || !summary ? '—' : summary.errorsLast24h.toLocaleString('ru-RU'),
      icon: <AlertTriangle size={18} />,
      accent: 'danger' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
};
