import { Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_LABEL } from '../permissions';
import { isFcmConfigured } from '@/lib/firebase/messaging';
import { Badge } from '../ui';

export const AdminSettingsPage = () => {
  const { profile } = useAuthStore();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '—';
  const fcmReady = isFcmConfigured();
  return (
    <div className="p-8 md:p-12 space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Settings className="text-accent-primary" /> Настройки
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Серверные настройки управляются через Supabase secrets и переменные окружения. Здесь — только статусная информация.
        </p>
      </header>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <h2 className="font-bold">Текущий пользователь</h2>
        <div className="text-sm grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</div>
            <div className="font-mono text-xs">{profile?.email ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Роль</div>
            <Badge tone="primary">{profile ? ROLE_LABEL[profile.role] : '—'}</Badge>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-3">
        <h2 className="font-bold">Интеграции</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Supabase</span>
          <Badge tone={supabaseUrl !== '—' ? 'success' : 'danger'}>
            {supabaseUrl !== '—' ? 'настроен' : 'не настроен'}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>FCM (Web Push)</span>
          <Badge tone={fcmReady ? 'success' : 'warning'}>{fcmReady ? 'клиент готов' : 'нет VAPID-ключа'}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Реальная отправка push требует серверный секрет <code className="font-mono">FCM_SERVICE_ACCOUNT_JSON</code>{' '}
          в Supabase Edge Functions (<code>supabase secrets set FCM_SERVICE_ACCOUNT_JSON=...</code>).
        </p>
      </section>

      <section className="bg-card border border-border rounded-3xl p-6 space-y-3">
        <h2 className="font-bold">Как создать первого super_admin</h2>
        <pre className="bg-background border border-border rounded-2xl p-4 text-xs overflow-x-auto">
{`-- Запустить в Supabase SQL editor (один раз):
UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'shiroihiraoka@gmail.com'
);`}
        </pre>
      </section>
    </div>
  );
};
