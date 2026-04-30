import { ShieldCheck } from 'lucide-react';
import { Badge } from '../ui';

const matrix: { capability: string; user: boolean; moderator: boolean; admin: boolean; super_admin: boolean }[] = [
  { capability: 'Использовать приложение', user: true, moderator: true, admin: true, super_admin: true },
  { capability: 'Видеть список пользователей', user: false, moderator: true, admin: true, super_admin: true },
  { capability: 'Просматривать активность / жалобы', user: false, moderator: true, admin: true, super_admin: true },
  { capability: 'Управлять пользователями (блок/разблок)', user: false, moderator: false, admin: true, super_admin: true },
  { capability: 'Выдавать / снимать подписки', user: false, moderator: false, admin: true, super_admin: true },
  { capability: 'Отправлять push-уведомления', user: false, moderator: false, admin: true, super_admin: true },
  { capability: 'Менять роли пользователей', user: false, moderator: false, admin: true, super_admin: true },
  { capability: 'Назначать admin / super_admin', user: false, moderator: false, admin: false, super_admin: true },
  { capability: 'Видеть логи всех действий', user: false, moderator: false, admin: false, super_admin: true },
  { capability: 'Менять super_admin', user: false, moderator: false, admin: false, super_admin: true },
];

const cell = (v: boolean) => (
  <span className={v ? 'text-accent-success font-bold' : 'text-muted-foreground/40'}>{v ? '✓' : '—'}</span>
);

export const AdminRolesPage = () => (
  <div className="p-8 md:p-12 space-y-6">
    <header>
      <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
        <ShieldCheck className="text-accent-primary" /> Роли и права
      </h1>
      <p className="text-muted-foreground text-sm">
        Иерархия и матрица возможностей. Все проверки также продублированы на сервере (RLS + SECURITY DEFINER функции).
      </p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {(['user', 'moderator', 'admin', 'super_admin'] as const).map((r) => (
        <div key={r} className="bg-card border border-border rounded-3xl p-5">
          <Badge tone={r === 'super_admin' || r === 'admin' ? 'primary' : r === 'moderator' ? 'warning' : 'default'}>
            {r}
          </Badge>
          <h3 className="font-bold text-lg mt-3 mb-1 capitalize">{r.replace('_', ' ')}</h3>
          <p className="text-xs text-muted-foreground">
            {r === 'user'
              ? 'Обычный пользователь приложения.'
              : r === 'moderator'
              ? 'Видит пользователей и жалобы; не может выполнять админские действия.'
              : r === 'admin'
              ? 'Управляет пользователями, выдаёт подписки, шлёт push.'
              : 'Полный контроль: роли, super_admin, логи.'}
          </p>
        </div>
      ))}
    </div>

    <div className="bg-card border border-border rounded-3xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="p-4">Возможность</th>
            <th className="p-4 text-center">user</th>
            <th className="p-4 text-center">moderator</th>
            <th className="p-4 text-center">admin</th>
            <th className="p-4 text-center">super_admin</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.capability} className="border-b border-border last:border-0">
              <td className="p-4">{row.capability}</td>
              <td className="p-4 text-center">{cell(row.user)}</td>
              <td className="p-4 text-center">{cell(row.moderator)}</td>
              <td className="p-4 text-center">{cell(row.admin)}</td>
              <td className="p-4 text-center">{cell(row.super_admin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
