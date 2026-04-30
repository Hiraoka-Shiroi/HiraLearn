import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus, RefreshCw } from 'lucide-react';
import { adminService, type GrantDuration } from '../adminService';
import type { AdminUserRow, SubscriptionPlan } from '@/types/database';
import { Badge, Button, Input, Modal, Select, Spinner, Textarea } from '../ui';
import { useToast } from '../useToast';
import { canGrantSubscription } from '../permissions';
import { useAuthStore } from '@/store/useAuthStore';

const PLANS: SubscriptionPlan[] = ['premium', 'pro', 'lifetime', 'student'];

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const AdminSubscriptionsPage = () => {
  const { profile: caller } = useAuthStore();
  const toast = useToast();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [planFilter, setPlanFilter] = useState<SubscriptionPlan | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listUsers({
        plan: planFilter || undefined,
        onlyActiveSub: true,
        sort: 'created_desc',
        limit: 200,
      });
      setRows(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [planFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const expireNow = async () => {
    try {
      const n = await adminService.expireSubscriptions();
      toast.success(`Истёкших подписок: ${n}`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="p-8 md:p-12 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
            <CreditCard className="text-accent-primary" /> Подписки
          </h1>
          <p className="text-muted-foreground text-sm">Все активные подписки. После истечения переводятся в expired.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={expireNow}>
            <RefreshCw size={14} /> Деактивировать истёкшие
          </Button>
          <Button onClick={() => setGrantOpen(true)} disabled={!canGrantSubscription(caller)}>
            <Plus size={14} /> Выдать подписку
          </Button>
        </div>
      </header>

      <div className="flex gap-3">
        <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as SubscriptionPlan | '')} className="max-w-xs">
          <option value="">Все планы</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="p-4">Пользователь</th>
                <th className="p-4">План</th>
                <th className="p-4">Истекает</th>
                <th className="p-4">Регистрация</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr><td colSpan={4} className="p-6 text-accent-danger">{error}</td></tr>
              ) : null}
              {loading && rows.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground"><Spinner /> загрузка...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Нет активных подписок</td></tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="font-bold">{u.full_name || u.username || '—'}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <Badge tone={u.plan === 'lifetime' ? 'success' : 'warning'}>{u.plan}</Badge>
                    </td>
                    <td className="p-4 text-xs">
                      {u.plan_ends_at ? formatDate(u.plan_ends_at) : <span className="text-accent-success font-bold">∞ навсегда</span>}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GrantModal
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        onDone={async () => {
          setGrantOpen(false);
          await load();
        }}
      />
    </div>
  );
};

const GrantModal = ({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<AdminUserRow[]>([]);
  const [picked, setPicked] = useState<AdminUserRow | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>('premium');
  const [duration, setDuration] = useState<GrantDuration>('30d');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setPicked(null);
      setPlan('premium');
      setDuration('30d');
      setReason('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || search.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await adminService.listUsers({ search, limit: 8 });
        setResults(data);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, open, toast]);

  const submit = async () => {
    if (!picked) return;
    setSubmitting(true);
    try {
      await adminService.grantSubscription(picked.id, plan, duration, reason || undefined);
      toast.success(`Подписка ${plan} выдана для ${picked.email}`);
      await onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Выдать подписку"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={submitting} disabled={!picked}>Выдать</Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Пользователь</label>
          <Input
            placeholder="email или имя"
            value={picked ? `${picked.full_name || picked.username || ''} <${picked.email}>` : search}
            onChange={(e) => {
              setPicked(null);
              setSearch(e.target.value);
            }}
          />
          {!picked && results.length > 0 ? (
            <div className="mt-2 bg-background border border-border rounded-2xl max-h-48 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left p-3 hover:bg-white/5 border-b border-border last:border-0"
                  onClick={() => setPicked(r)}
                >
                  <div className="font-bold text-xs">{r.full_name || r.username || '—'}</div>
                  <div className="text-[10px] text-muted-foreground">{r.email}</div>
                </button>
              ))}
            </div>
          ) : null}
          {!picked && search.length >= 2 && !searching && results.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-2">Ничего не найдено</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">План</label>
            <Select value={plan} onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}>
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Срок</label>
            <Select value={duration} onChange={(e) => setDuration(e.target.value as GrantDuration)} disabled={plan === 'lifetime'}>
              <option value="7d">7 дней</option>
              <option value="30d">30 дней</option>
              <option value="90d">90 дней</option>
              <option value="365d">1 год</option>
              <option value="forever">Навсегда</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Комментарий</label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Например: подарок постоянному клиенту" />
        </div>
      </div>
    </Modal>
  );
};
