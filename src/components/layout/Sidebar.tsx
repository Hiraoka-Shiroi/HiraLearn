import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Gamepad2, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/useLanguage';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeToggle } from '@/components/ModeToggle';
import { TranslationKey } from '@/i18n/translations';

const menuItems: { id: string; labelKey: TranslationKey; icon: React.ReactNode; path: string }[] = [
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

  return (
    <aside className="w-20 md:w-64 h-screen bg-card border-r border-border flex flex-col py-8 px-4 shrink-0 transition-all">
      <Link to="/dashboard" className="flex items-center gap-3 px-4 mb-12 group">
        <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-white rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-lg shadow-accent-primary/20">
           <div className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500">H</div>
        </div>
        <span className="text-xl font-bold hidden md:block">HiraLearn</span>
      </Link>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                isActive
                ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                : 'text-muted-foreground hover:bg-accent-primary/5 hover:text-accent-primary'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="font-bold hidden md:block">{t(item.labelKey)}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 bg-white rounded-full hidden md:block"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="hidden md:flex gap-2 px-2">
          <LanguageToggle />
          <ModeToggle />
          <ThemeToggle />
        </div>

        <div className="hidden md:block p-4 bg-background border border-border rounded-2xl">
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('sidebar_level')} {profile?.level || 1}</p>
           <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent-primary transition-all" style={{ width: `${Math.min(((profile?.xp ?? 0) % 500) / 500 * 100, 100)}%` }} />
           </div>
        </div>

        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl text-muted-foreground hover:bg-accent-danger/5 hover:text-accent-danger transition-all group"
        >
          <LogOut size={20} />
          <span className="font-bold hidden md:block">{t('sidebar_logout')}</span>
        </button>
      </div>
    </aside>
  );
};
