import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { AdminUserRow } from '@/types/database';

interface UserTableProps {
  users: AdminUserRow[];
  loading: boolean;
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const UserTable = ({ users, loading }: UserTableProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.username, u.full_name]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
    );
  }, [users, query]);

  return (
    <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-lg font-bold">Пользователи</h2>
          <p className="text-xs text-muted mt-1">{users.length} учеников</p>
        </div>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по email или имени"
            className="bg-background border border-border rounded-2xl pl-9 pr-4 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent-primary w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-background/50 border-b border-border">
            <tr>
              <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-muted">
                User
              </th>
              <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-muted">
                Role
              </th>
              <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-muted">
                Level
              </th>
              <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-muted">
                XP
              </th>
              <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-muted">
                Last activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted">
                  Загрузка…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted">
                  Пользователи не найдены.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-background/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-sm">
                      {u.full_name || u.username || '—'}
                    </div>
                    <div className="text-[11px] text-muted">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        u.role === 'admin'
                          ? 'bg-accent-success/15 text-accent-success'
                          : 'bg-border text-muted'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono">{u.level}</td>
                  <td className="p-4 text-sm font-mono">{u.xp.toLocaleString('ru-RU')}</td>
                  <td className="p-4 text-sm text-muted">{formatDate(u.last_active_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
