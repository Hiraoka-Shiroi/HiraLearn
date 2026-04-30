import { ReactNode, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users as UsersIcon,
  ShieldCheck,
  CreditCard,
  Bell,
  ScrollText,
  Settings,
  ArrowLeft,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { canViewLogs, canViewUsers, isAdmin, isStaff, isSuperAdmin, ROLE_LABEL } from './permissions';
import { ToastHost } from './ToastHost';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  show: (canSeeAdmin: boolean, canSeeUsers: boolean, canSeeLogs: boolean, canSeeSuper: boolean) => boolean;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, show: () => true, end: true },
  { to: '/admin/users', label: 'Пользователи', icon: <UsersIcon size={18} />, show: (_a, u) => u },
  { to: '/admin/roles', label: 'Роли и права', icon: <ShieldCheck size={18} />, show: (_a, _u, _l, s) => s },
  { to: '/admin/subscriptions', label: 'Подписки', icon: <CreditCard size={18} />, show: (a) => a },
  { to: '/admin/push', label: 'Push-уведомления', icon: <Bell size={18} />, show: (a) => a },
  { to: '/admin/logs', label: 'Логи действий', icon: <ScrollText size={18} />, show: (_a, _u, l) => l },
  { to: '/admin/lessons', label: 'Уроки', icon: <BookOpen size={18} />, show: (a) => a },
  { to: '/admin/settings', label: 'Настройки', icon: <Settings size={18} />, show: (a) => a },
];

export const AdminLayout = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canAdmin = isAdmin(profile);
  const canUsers = canViewUsers(profile);
  const canLogs = canViewLogs(profile);
  const canSuper = isSuperAdmin(profile);
  const items = NAV.filter((n) => n.show(canAdmin, canUsers, canLogs, canSuper));

  const sidebarContent = (
    <>
      <div className="p-4 md:p-6 border-b border-border">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> в приложение
        </button>
        <h1 className="font-black text-lg md:text-xl mt-3">HiraLearn Admin</h1>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          {profile ? ROLE_LABEL[profile.role] : '—'}
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-accent-primary text-white'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`
            }
          >
            {it.icon}
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border text-[10px] text-muted-foreground uppercase tracking-widest truncate">
        {profile?.email ?? profile?.full_name ?? '—'}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
        <h1 className="font-black text-base">Admin</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl active:bg-surface-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="md:hidden fixed top-14 left-0 bottom-0 z-50 w-72 bg-card border-r border-border flex flex-col overflow-y-auto">
            {sidebarContent}
          </aside>
        </>
      )}

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>

      <ToastHost />
    </div>
  );
};

export const AdminGate = ({
  children,
  require,
}: {
  children: ReactNode;
  require?: 'staff' | 'admin' | 'super_admin';
}) => {
  const { profile } = useAuthStore();
  const ok =
    require === 'super_admin'
      ? isSuperAdmin(profile)
      : require === 'staff'
      ? isStaff(profile)
      : isAdmin(profile);
  if (!ok) {
    return (
      <div className="p-6 md:p-12">
        <div className="bg-accent-danger/10 border border-accent-danger/30 text-accent-danger rounded-2xl p-6">
          <h2 className="font-bold mb-1">Недостаточно прав</h2>
          <p className="text-sm opacity-80">
            Этот раздел доступен только для уровня доступа{' '}
            <span className="font-mono">{require ?? 'admin'}</span>.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
