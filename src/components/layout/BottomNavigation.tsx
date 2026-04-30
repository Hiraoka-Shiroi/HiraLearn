import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Gamepad2, User, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/i18n/useLanguage';
import { isStaff } from '@/features/admin/permissions';
import type { TranslationKey } from '@/i18n/translations';

interface NavItem {
  id: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
  path: string;
}

const baseItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'sidebar_path', icon: <LayoutDashboard size={22} />, path: '/dashboard' },
  { id: 'courses', labelKey: 'sidebar_courses', icon: <BookOpen size={22} />, path: '/courses' },
  { id: 'games', labelKey: 'sidebar_arcade', icon: <Gamepad2 size={22} />, path: '/games' },
  { id: 'profile', labelKey: 'sidebar_profile', icon: <User size={22} />, path: '/profile' },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { t } = useLanguage();

  const items = isStaff(profile)
    ? [...baseItems, { id: 'admin', labelKey: 'sidebar_admin' as TranslationKey, icon: <Shield size={22} />, path: '/admin' }]
    : baseItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div
        className="bg-card/90 backdrop-blur-xl border-t border-border safe-bottom"
        style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="flex items-stretch justify-around px-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path
              || (item.path === '/admin' && location.pathname.startsWith('/admin'));

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-w-[3rem] min-h-[3rem] flex-1 transition-colors ${
                  isActive
                    ? 'text-accent-primary'
                    : 'text-muted-foreground active:text-foreground'
                }`}
              >
                <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-accent-primary/10' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-semibold leading-tight">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
