import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { adminService } from '../adminService';
import type { AdminLog } from '@/types/database';
import { Badge, Button, Input, Select, Spinner } from '../ui';

const ACTIONS = ['', 'role.change', 'status.change', 'subscription.grant', 'subscription.revoke', 'push.send'];

const formatTime = (s: string) =>
  new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const summarize = (log: AdminLog): string => {
  if (log.action === 'role.change') {
    const o = (log.old_value as { role?: string } | null)?.role;
    const n = (log.new_value as { role?: string } | null)?.role;
    return `${o ?? '—'} → ${n ?? '—'}`;
  }
  if (log.action === 'status.change') {
    const o = (log.old_value as { status?: string } | null)?.status;
    const n = (log.new_value as { status?: string } | null)?.status;
    return `${o ?? '—'} → ${n ?? '—'}`;
  }
  if (log.action === 'subscription.grant') {
    const plan = (log.new_value as { plan?: string } | null)?.plan;
    const ends = (log.new_value as { ends_at?: string } | null)?.ends_at;
    return `${plan ?? '—'}${ends ? ` до ${new Date(ends).toLocaleDateString('ru-RU')}` : ' (навсегда)'}`;
  }
  if (log.action === 'subscription.revoke') return 'снята';
  if (log.action === 'push.send') {
    const sent = (log.new_value as { sent_count?: number } | null)?.sent_count ?? 0;
    return `отправлено ${sent}`;
  }
  return '';
};

export const AdminLogsPage = () => {
  const [rows, setRows] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listLogs({
        action: actionFilter || undefined,
        limit: 200,
      });
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.admin_email ?? '').toLowerCase().includes(q) ||
      (r.target_email ?? '').toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 md:p-12 space-y-6">
      <header>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <ScrollText className="text-accent-primary" /> Логи действий
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Все опасные действия админов сохраняются автоматически. Виден только super_admin.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="поиск по email или action" className="md:max-w-xs" />
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="md:max-w-xs">
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a || 'все действия'}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => void load()}>Обновить</Button>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="p-4">Когда</th>
                <th className="p-4">Кто</th>
                <th className="p-4">Над кем</th>
                <th className="p-4">Действие</th>
                <th className="p-4">Изменение</th>
              </tr>
            </thead>
            <tbody>
              {error ? <tr><td colSpan={5} className="p-6 text-accent-danger">{error}</td></tr> : null}
              {loading && rows.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Spinner /> загрузка...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Логов нет</td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 align-top">
                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">{formatTime(l.created_at)}</td>
                    <td className="p-4 text-xs">
                      <div className="font-bold">{l.admin_name || l.admin_email || '—'}</div>
                      <div className="text-muted-foreground">{l.admin_email}</div>
                    </td>
                    <td className="p-4 text-xs">
                      {l.target_user_id ? (
                        <>
                          <div className="font-bold">{l.target_name || l.target_email || '—'}</div>
                          <div className="text-muted-foreground">{l.target_email}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4">
                      <Badge tone={l.action.includes('grant') ? 'success' : l.action.includes('revoke') ? 'danger' : 'primary'}>
                        {l.action}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{summarize(l)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
