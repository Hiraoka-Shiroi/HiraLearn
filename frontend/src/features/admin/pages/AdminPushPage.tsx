import { useEffect, useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { adminService } from '../adminService';
import type {
  AdminUserRow,
  NotificationAudience,
  NotificationRecord,
  Role,
  SubscriptionPlan,
} from '@/types/database';
import { Badge, Button, Input, Select, Spinner, Textarea } from '../ui';
import { useToast } from '../useToast';
import { ROLE_LABEL } from '../permissions';

type AudienceType = 'all' | 'plan' | 'role' | 'user';

export const AdminPushPage = () => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [audType, setAudType] = useState<AudienceType>('all');
  const [audValue, setAudValue] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<AdminUserRow[]>([]);
  const [pickedUser, setPickedUser] = useState<AdminUserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadHistory(); }, []);

  useEffect(() => {
    if (audType !== 'user' || userSearch.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const data = await adminService.listUsers({ search: userSearch, limit: 8 });
        setUserResults(data);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [userSearch, audType, toast]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await adminService.listNotifications();
      setHistory(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const buildAudience = (): NotificationAudience | null => {
    if (audType === 'all') return { type: 'all' };
    if (audType === 'role' && audValue) return { type: 'role', value: audValue as Role };
    if (audType === 'plan' && audValue) return { type: 'plan', value: audValue as SubscriptionPlan };
    if (audType === 'user' && pickedUser) return { type: 'user', value: pickedUser.id };
    return null;
  };

  const submit = async () => {
    const audience = buildAudience();
    if (!title || !body || !audience) {
      toast.error('Заполните заголовок, текст и аудиторию');
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminService.sendPush({
        title,
        body,
        link: link || undefined,
        audience,
      });
      toast.success(
        `Аудитория: ${res.audience_size}. Отправлено: ${res.sent}, ошибок: ${res.failed}, невалидных токенов: ${res.invalid_tokens}`,
      );
      setTitle('');
      setBody('');
      setLink('');
      await loadHistory();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 md:p-12 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 space-y-6">
        <header>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Bell className="text-accent-primary" /> Push-уведомления
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Реальная отправка через FCM. Невалидные токены автоматически деактивируются.
          </p>
        </header>

        <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Заголовок</label>
            <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Новый урок!" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Текст</label>
            <Textarea
              value={body}
              maxLength={240}
              rows={3}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Что сообщить пользователям?"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ссылка (опционально)</label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Аудитория</label>
              <Select
                value={audType}
                onChange={(e) => {
                  setAudType(e.target.value as AudienceType);
                  setAudValue('');
                  setPickedUser(null);
                  setUserSearch('');
                }}
              >
                <option value="all">Все пользователи</option>
                <option value="plan">По подписке</option>
                <option value="role">По роли</option>
                <option value="user">Конкретный пользователь</option>
              </Select>
            </div>
            <div>
              {audType === 'plan' ? (
                <>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">План</label>
                  <Select value={audValue} onChange={(e) => setAudValue(e.target.value)}>
                    <option value="">— выберите —</option>
                    {(['free', 'premium', 'pro', 'lifetime', 'student'] as SubscriptionPlan[]).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </>
              ) : audType === 'role' ? (
                <>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Роль</label>
                  <Select value={audValue} onChange={(e) => setAudValue(e.target.value)}>
                    <option value="">— выберите —</option>
                    {(['user', 'moderator', 'admin', 'super_admin'] as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </Select>
                </>
              ) : audType === 'user' ? (
                <>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Пользователь</label>
                  <Input
                    value={pickedUser ? pickedUser.email : userSearch}
                    onChange={(e) => {
                      setPickedUser(null);
                      setUserSearch(e.target.value);
                    }}
                    placeholder="email или имя"
                  />
                  {!pickedUser && userResults.length > 0 ? (
                    <div className="mt-1 bg-background border border-border rounded-2xl max-h-40 overflow-y-auto">
                      {userResults.map((r) => (
                        <button
                          key={r.id}
                          className="w-full text-left p-2 text-xs hover:bg-white/5"
                          onClick={() => setPickedUser(r)}
                        >
                          {r.email} — {r.full_name || '—'}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <Button onClick={submit} loading={submitting} disabled={!title || !body}>
          <Send size={14} /> Отправить
        </Button>
      </section>

      <aside className="space-y-4">
        <div className="bg-card border border-border rounded-3xl p-5">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Превью</h3>
          <div className="bg-background border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{title || 'Заголовок уведомления'}</div>
                <div className="text-xs text-muted-foreground line-clamp-3 mt-1">{body || 'Текст уведомления...'}</div>
                {link ? <div className="text-[10px] text-accent-primary mt-2 truncate">{link}</div> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-5">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">История</h3>
          {loadingHistory ? (
            <div className="text-muted-foreground text-sm flex items-center gap-2"><Spinner /> загрузка...</div>
          ) : history.length === 0 ? (
            <div className="text-muted-foreground text-sm">Пока ничего не отправляли</div>
          ) : (
            <ul className="space-y-3 max-h-[600px] overflow-y-auto">
              {history.map((n) => (
                <li key={n.id} className="border border-border rounded-2xl p-3">
                  <div className="font-bold text-sm truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge tone="primary">
                      {n.audience.type === 'all'
                        ? 'все'
                        : n.audience.type === 'role'
                        ? `role:${(n.audience as { value: string }).value}`
                        : n.audience.type === 'plan'
                        ? `plan:${(n.audience as { value: string }).value}`
                        : 'user'}
                    </Badge>
                    <span className="text-[10px] text-accent-success">отправлено: {n.sent_count}</span>
                    {n.failed_count > 0 ? (
                      <span className="text-[10px] text-accent-danger">ошибок: {n.failed_count}</span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(n.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};
