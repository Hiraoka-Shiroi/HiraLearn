import { MainLayout } from '@/components/layout/MainLayout';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminMetrics } from './hooks/useAdminMetrics';
import { AdminStats } from './components/AdminStats';
import { ErrorMonitor } from './components/ErrorMonitor';
import { SystemPulse } from './components/SystemPulse';
import { UserTable } from './components/UserTable';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    summary,
    errorBuckets,
    pulseBuckets,
    recentErrors,
    users,
    loading,
    error,
    refresh,
  } = useAdminMetrics();

  return (
    <MainLayout>
      <div className="p-8 md:p-12 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Console</h1>
            <p className="text-muted">
              Состояние HiraLearn в реальном времени.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2 text-sm font-bold hover:border-accent-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Обновить
            </button>
            <button
              onClick={() => navigate('/admin/lessons')}
              className="flex items-center gap-1 bg-accent-primary text-white px-5 py-2 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all"
            >
              Уроки
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {error ? (
          <div className="bg-accent-danger/10 border border-accent-danger/30 text-accent-danger rounded-2xl p-4 text-sm">
            {error}
          </div>
        ) : null}

        <AdminStats summary={summary} loading={loading} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SystemPulse buckets={pulseBuckets} />
          <ErrorMonitor buckets={errorBuckets} recent={recentErrors} loading={loading} />
        </div>

        <UserTable users={users} loading={loading} />
      </div>
    </MainLayout>
  );
};
