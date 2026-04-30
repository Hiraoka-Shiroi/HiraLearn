import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Edit3, Ban, CheckCircle2, Crown, CreditCard, X as XIcon } from 'lucide-react';
import { adminService, type SortOption } from '../adminService';
import type { AccountStatus, AdminUserRow, Role, SubscriptionPlan } from '@/types/database';
import { Badge, Button, Input, Modal, Select, Spinner, Textarea } from '../ui';
import { useToast } from '../useToast';
import { useAuthStore } from '@/store/useAuthStore';
import { canBlockUser, canChangeRole, canGrantSubscription, ROLE_LABEL } from '../permissions';

const ROLES: Role[] = ['user', 'moderator', 'admin', 'super_admin'];
const PLANS: SubscriptionPlan[] = ['free', 'student', 'premium', 'pro', 'lifetime'];
const STATUSES: AccountStatus[] = ['active', 'banned'];

const PAGE_SIZE = 25;

const formatDate = (d: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const planTone = (
  plan: SubscriptionPlan | null | undefined,
  active: boolean,
): 'success' | 'warning' | 'default' => {
  if (!plan || plan === 'free' || !active) return 'default';
  if (plan === 'lifetime') return 'success';
  return 'warning';
};

export const AdminUsersPage = () => {
  const { profile: caller } = useAuthStore();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<AccountStatus | ''>('');
  const [plan, setPlan] = useState<SubscriptionPlan | ''>('');
  const [onlyActiveSub, setOnlyActiveSub] = useState<'' | 'true' | 'false'>('');
  const [sort, setSort] = useState<SortOption>('created_desc');
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);

  const totalCount = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(Number(totalCount) / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listUsers({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        plan: plan || undefined,
        onlyActiveSub: onlyActiveSub === '' ? undefined : onlyActiveSub === 'true',
        sort,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, role, status, plan, onlyActiveSub, sort, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh after action
  const refreshOne = async (userId: string) => {
    try {
      const next = await adminService.listUsers({
        search: userId,
        sort,
        limit: 1,
      });
      if (next[0]) {
        setRows((prev) => prev.map((r) => (r.id === userId ? { ...next[0] } : r)));
      } else {
        await load();
      }
    } catch {
      await load();
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Пользователи</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? 'Загрузка...' : `Всего: ${Number(totalCount).toLocaleString('ru-RU')}`}
          </p>
        </div>
      </header>

      <div className="bg-card border border-border rounded-3xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-6 gap-3">
        <form
          className="md:col-span-2 relative"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setSearch(searchInput.trim());
          }}
        >
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по email или имени"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>
        <Select value={role} onChange={(e) => { setPage(0); setRole(e.target.value as Role | ''); }}>
          <option value="">Все роли</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
        <Select value={plan} onChange={(e) => { setPage(0); setPlan(e.target.value as SubscriptionPlan | ''); }}>
          <option value="">Все подписки</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => { setPage(0); setStatus(e.target.value as AccountStatus | ''); }}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'active' ? 'Активные' : 'Заблокированные'}
            </option>
          ))}
        </Select>
        <Select value={onlyActiveSub} onChange={(e) => { setPage(0); setOnlyActiveSub(e.target.value as '' | 'true' | 'false'); }}>
          <option value="">Подписка: любая</option>
          <option value="true">Только активные</option>
          <option value="false">Без активной</option>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="p-4">Пользователь</th>
                <th className="p-4">Роль</th>
                <th className="p-4">Статус</th>
                <th className="p-4">Подписка</th>
                <th
                  className="p-4 cursor-pointer select-none"
                  onClick={() =>
                    setSort((s) => (s === 'created_desc' ? 'created_asc' : 'created_desc'))
                  }
                >
                  Регистрация {sort.startsWith('created') ? (sort === 'created_desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className="p-4 cursor-pointer select-none"
                  onClick={() =>
                    setSort((s) => (s === 'last_seen_desc' ? 'last_seen_asc' : 'last_seen_desc'))
                  }
                >
                  Последняя активность {sort.startsWith('last_seen') ? (sort === 'last_seen_desc' ? '↓' : '↑') : ''}
                </th>
                <th className="p-4 w-32">Действия</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td colSpan={7} className="p-6 text-accent-danger">{error}</td></tr>
              ) : null}
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Spinner /> загрузка...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Нет результатов</td></tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="font-bold">{u.full_name || u.username || '—'}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{u.id.slice(0, 8)}</div>
                    </td>
                    <td className="p-4">
                      <Badge tone={u.role === 'super_admin' ? 'primary' : u.role === 'admin' ? 'primary' : u.role === 'moderator' ? 'warning' : 'default'}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {u.status === 'banned' ? (
                        <Badge tone="danger">заблокирован</Badge>
                      ) : (
                        <Badge tone="success">активен</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {u.plan && u.plan_active ? (
                        <div>
                          <Badge tone={planTone(u.plan, u.plan_active)}>{u.plan}</Badge>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            до {formatDate(u.plan_ends_at)}
                          </div>
                        </div>
                      ) : (
                        <Badge tone="default">free</Badge>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="p-4 text-xs text-muted-foreground">{formatDate(u.last_seen_at)}</td>
                    <td className="p-4">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>
                        <Edit3 size={12} /> Открыть
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted-foreground">
          <span>
            Стр. {page + 1} из {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft size={14} /> назад
            </Button>
            <Button size="sm" variant="ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              далее <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      <UserDetailsModal
        user={editing}
        caller={caller}
        onClose={() => setEditing(null)}
        onUpdated={async (id) => {
          await refreshOne(id);
        }}
        toast={toast}
      />
    </div>
  );
};

const UserDetailsModal = ({
  user,
  caller,
  onClose,
  onUpdated,
  toast,
}: {
  user: AdminUserRow | null;
  caller: import('@/types/database').Profile | null;
  onClose: () => void;
  onUpdated: (userId: string) => Promise<void>;
  toast: ReturnType<typeof useToast>;
}) => {
  const [submittingRole, setSubmittingRole] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [submittingGrant, setSubmittingGrant] = useState(false);
  const [submittingRevoke, setSubmittingRevoke] = useState(false);

  const [pickedRole, setPickedRole] = useState<Role | ''>('');
  const [reason, setReason] = useState('');
  const [grantPlan, setGrantPlan] = useState<SubscriptionPlan>('premium');
  const [grantDuration, setGrantDuration] = useState<'7d' | '30d' | '90d' | '365d' | 'forever'>('30d');
  const [grantReason, setGrantReason] = useState('');

  useEffect(() => {
    setPickedRole('');
    setReason('');
    setGrantPlan('premium');
    setGrantDuration('30d');
    setGrantReason('');
  }, [user?.id]);

  const roleCheck = useMemo(
    () => (user && pickedRole ? canChangeRole(caller, user, pickedRole) : { ok: false }),
    [caller, user, pickedRole],
  );
  const blockCheck = useMemo(
    () => (user ? canBlockUser(caller, user) : { ok: false }),
    [caller, user],
  );
  const subCheck = canGrantSubscription(caller);

  if (!user) return null;

  const setRole = async () => {
    if (!pickedRole || !roleCheck.ok) return;
    setSubmittingRole(true);
    try {
      await adminService.setUserRole(user.id, pickedRole, reason || undefined);
      toast.success(`Роль обновлена: ${pickedRole}`);
      await onUpdated(user.id);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmittingRole(false);
    }
  };

  const toggleBlock = async () => {
    if (!blockCheck.ok) return;
    const newStatus: AccountStatus = user.status === 'banned' ? 'active' : 'banned';
    if (!confirm(newStatus === 'banned' ? 'Заблокировать пользователя?' : 'Разблокировать пользователя?')) return;
    setSubmittingStatus(true);
    try {
      await adminService.setUserStatus(user.id, newStatus, reason || undefined);
      toast.success(newStatus === 'banned' ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      await onUpdated(user.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const grant = async () => {
    if (!subCheck) return;
    setSubmittingGrant(true);
    try {
      await adminService.grantSubscription(user.id, grantPlan, grantDuration, grantReason || undefined);
      toast.success(`Подписка ${grantPlan} выдана`);
      await onUpdated(user.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmittingGrant(false);
    }
  };

  const revoke = async () => {
    if (!subCheck) return;
    if (!confirm('Снять подписку у пользователя?')) return;
    setSubmittingRevoke(true);
    try {
      await adminService.revokeSubscription(user.id, reason || undefined);
      toast.success('Подписка снята');
      await onUpdated(user.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmittingRevoke(false);
    }
  };

  return (
    <Modal open={!!user} onClose={onClose} title={`Карточка: ${user.full_name || user.email}`}>
      <div className="space-y-6 text-sm">
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-background border border-border rounded-2xl p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">email</div>
            <div className="font-mono text-xs break-all">{user.email}</div>
          </div>
          <div className="bg-background border border-border rounded-2xl p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">id</div>
            <div className="font-mono text-xs break-all">{user.id}</div>
          </div>
          <div className="bg-background border border-border rounded-2xl p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">регистрация</div>
            <div>{formatDate(user.created_at)}</div>
          </div>
          <div className="bg-background border border-border rounded-2xl p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">последний вход</div>
            <div>{formatDate(user.last_seen_at)}</div>
          </div>
        </section>

        <section>
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <Crown size={14} /> Роль
          </h4>
          <div className="flex gap-2 items-center">
            <Select value={pickedRole} onChange={(e) => setPickedRole(e.target.value as Role | '')} className="flex-1">
              <option value="">{ROLE_LABEL[user.role]} (без изменений)</option>
              {ROLES.filter((r) => r !== user.role).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
            <Button onClick={setRole} loading={submittingRole} disabled={!pickedRole || !roleCheck.ok}>
              Применить
            </Button>
          </div>
          {pickedRole && !roleCheck.ok ? (
            <p className="text-xs text-accent-danger mt-2">{roleCheck.reason}</p>
          ) : null}
        </section>

        <section>
          <h4 className="font-bold mb-2 flex items-center gap-2">
            {user.status === 'banned' ? <CheckCircle2 size={14} /> : <Ban size={14} />}
            Статус: {user.status === 'banned' ? 'заблокирован' : 'активен'}
          </h4>
          <Button
            variant={user.status === 'banned' ? 'secondary' : 'danger'}
            onClick={toggleBlock}
            loading={submittingStatus}
            disabled={!blockCheck.ok}
          >
            {user.status === 'banned' ? 'Разблокировать' : 'Заблокировать'}
          </Button>
          {!blockCheck.ok ? <p className="text-xs text-muted-foreground mt-2">{blockCheck.reason}</p> : null}
        </section>

        <section className="bg-background border border-border rounded-2xl p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <CreditCard size={14} /> Подписка
          </h4>
          <div className="text-xs text-muted-foreground mb-3">
            Текущая: <span className="font-bold text-foreground">{user.plan && user.plan_active ? user.plan : 'free'}</span>
            {user.plan && user.plan_active ? ` · до ${formatDate(user.plan_ends_at)}` : ''}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value as SubscriptionPlan)}>
              {(['premium', 'pro', 'lifetime', 'student', 'free'] as SubscriptionPlan[]).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Select
              value={grantDuration}
              onChange={(e) => setGrantDuration(e.target.value as typeof grantDuration)}
              disabled={grantPlan === 'lifetime'}
            >
              <option value="7d">7 дней</option>
              <option value="30d">30 дней</option>
              <option value="90d">90 дней</option>
              <option value="365d">1 год</option>
              <option value="forever">Навсегда</option>
            </Select>
          </div>
          <Textarea
            placeholder="Причина / комментарий"
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            rows={2}
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={grant} loading={submittingGrant} disabled={!subCheck}>
              Выдать подписку
            </Button>
            <Button onClick={revoke} variant="danger" loading={submittingRevoke} disabled={!subCheck}>
              <XIcon size={14} /> Снять
            </Button>
          </div>
        </section>

        <section>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Причина (общая, для логов)
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: VIP клиент" />
        </section>
      </div>
    </Modal>
  );
};
