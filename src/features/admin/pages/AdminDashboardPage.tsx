import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Bell, CreditCard, Eye, Users, Wallet, Ban } from 'lucide-react';
import { adminService } from '../adminService';
import type { AdminDashboardSummary } from '@/types/database';
import { Spinner } from '../ui';

const fmt = new Intl.NumberFormat('ru-RU');

export const AdminDashboardPage = () => {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.dashboardSummary();
      setSummary(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cards = [
    { label: 'Всего пользователей', value: summary?.total_users, icon: <Users size={18} /> },
    { label: 'Активных за 30д', value: summary?.active_users_30d, icon: <Eye size={18} /> },
    { label: 'Заблокированных', value: summary?.banned_users, icon: <Ban size={18} /> },
    { label: 'Активных подписок', value: summary?.active_subscriptions, icon: <CreditCard size={18} /> },
    {
      label: 'Доход',
      value: summary ? `${fmt.format(Math.round(summary.total_revenue))} ₸` : null,
      icon: <Wallet size={18} />,
    },
    { label: 'Push токенов', value: summary?.push_tokens_active, icon: <Bell size={18} /> },
    { label: 'Push за 30д', value: summary?.notifications_sent_30d, icon: <Activity size={18} /> },
    { label: 'Ошибок за 24ч', value: summary?.errors_24h, icon: <AlertTriangle size={18} /> },
  ];

  return (
    <div className="p-4 md:p-12 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-black mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Сводка состояния приложения</p>
      </header>

      {error ? (
        <div className="bg-accent-danger/10 border border-accent-danger/30 text-accent-danger rounded-2xl p-4 text-sm">
          {error}
        </div>
      ) : null}

      {loading && !summary ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Загрузка...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4 text-muted-foreground">
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {c.label}
                </span>
                <span className="text-accent-primary">{c.icon}</span>
              </div>
              <div className="text-2xl font-black">
                {c.value === null || c.value === undefined
                  ? '—'
                  : typeof c.value === 'string'
                  ? c.value
                  : fmt.format(c.value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
