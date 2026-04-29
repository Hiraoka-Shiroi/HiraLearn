import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Gamepad2, User, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/useLanguage';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeToggle } from '@/components/ModeToggle';
import { TranslationKey } from '@/i18n/translations';
import { isStaff } from '@/features/admin/permissions';

const baseMenuItems: { id: string; labelKey: TranslationKey; icon: React.ReactNode; path: string }[] = [
  { id: 'dashboard', labelKey: 'sidebar_path', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { id: 'courses', labelKey: 'sidebar_courses', icon: <BookOpen size={20} />, path: '/courses' },
  { id: 'games', labelKey: 'sidebar_arcade', icon: <Gamepad2 size={20} />, path: '/games' },
  { id: 'profile', labelKey: 'sidebar_profile', icon: <User size={20} />, path: '/profile' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuthStore();
  const { t } = useLanguage();

  const menuItems = isStaff(profile)
    ? [...baseMenuItems, { id: 'admin', labelKey: 'sidebar_admin' as TranslationKey, icon: <Shield size={20} />, path: '/admin' }]
    : baseMenuItems;

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpPercent = Math.min(((xp) % 500) / 500 * 100, 100);

  return (
    <aside className="w-20 md:w-64 h-screen bg-card/80 backdrop-blur-sm border-r border-border flex flex-col py-6 px-3 md:px-4 shrink-0 transition-all">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 px-3 mb-10 group">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-indigo-400 rounded-xl flex items-center justify-center text-white rotate-45 group-hover:rotate-[135deg] transition-transform duration-700 shadow-glow-primary shrink-0">
           <div className="-rotate-45 group-hover:-rotate-[135deg] transition-transform duration-700 font-black text-sm">H</div>
        </div>
        <span className="text-lg font-black hidden md:block tracking-tight">HiraLearn</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                isActive
                ? 'text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent-primary rounded-xl shadow-glow-primary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 shrink-0">{item.icon}</div>
              <span className="relative z-10 font-semibold text-sm hidden md:block">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer section */}
      <div className="mt-auto space-y-3">
        {/* Toggles */}
        <div className="hidden md:flex gap-1.5 px-1">
          <LanguageToggle />
          <ModeToggle />
          <ThemeToggle />
        </div>

        {/* Level progress */}
        <div className="hidden md:block px-3 py-3 bg-surface-1 border border-border/50 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('sidebar_level')} {level}</span>
            <span className="text-[10px] font-bold text-accent-primary">{xp} XP</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-primary to-indigo-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={async () => { await signOut(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-accent-danger/5 hover:text-accent-danger transition-all group"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm hidden md:block">{t('sidebar_logout')}</span>
        </button>
      </div>
    </aside>
  );
};
