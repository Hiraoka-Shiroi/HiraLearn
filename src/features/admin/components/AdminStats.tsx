import { Users, Wallet, Activity, AlertTriangle } from 'lucide-react';
import { StatCard } from './StatCard';
import type { AdminSummary } from '../hooks/useAdminMetrics';

interface AdminStatsProps {
  summary: AdminSummary | null;
  loading: boolean;
}

const tengeFormatter = new Intl.NumberFormat('ru-RU');

export const AdminStats = ({ summary, loading }: AdminStatsProps) => {
  const cards = [
    {
      label: 'Total Users',
      value: loading || !summary ? '—' : summary.totalUsers.toLocaleString('ru-RU'),
      hint: 'Все зарегистрированные ученики',
      icon: <Users size={18} />,
      accent: 'primary' as const,
    },
    {
      label: 'Revenue',
      value:
        loading || !summary
          ? '—'
          : `${tengeFormatter.format(Math.round(summary.totalRevenue))} ₸`,
      hint: 'Сумма успешных платежей',
      icon: <Wallet size={18} />,
      accent: 'success' as const,
    },
    {
      label: 'System Pulse',
      value:
        loading || !summary
          ? '—'
          : summary.avgLoadMs !== null
            ? `${summary.avgLoadMs} ms`
            : 'нет данных',
      hint: 'Средняя скорость загрузки за 24ч',
      icon: <Activity size={18} />,
      accent: 'primary' as const,
    },
    {
      label: 'Error Rate',
      value: loading || !summary ? '—' : summary.errorsLast24h.toLocaleString('ru-RU'),
      hint: 'Ошибок за последние 24 часа',
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
