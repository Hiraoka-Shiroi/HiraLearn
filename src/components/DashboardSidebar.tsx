import { LayoutDashboard, Map, FolderKanban, Settings, LogOut, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { Link, useLocation } from 'react-router-dom';

export const DashboardSidebar = () => {
  const { profile, signOut } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Map size={20} />, label: 'The Path', path: '/dashboard' }, // Roadmap is in dashboard for now
    { icon: <FolderKanban size={20} />, label: 'My Projects', path: '/profile' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/profile' },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ icon: <ShieldCheck size={20} />, label: 'Admin', path: '/admin' });
  }

  return (
    <aside className="w-64 h-screen sticky top-0 bg-card border-r border-border flex flex-col p-6 z-40">
      <div className="flex items-center space-x-3 mb-12">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent-primary rounded-lg rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 bg-background rounded-sm -rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight">HiraLearn</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === item.path
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-muted hover:bg-border hover:text-foreground'
            }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
            {location.pathname === item.path && (
              <motion.div
                layoutId="active-nav"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-primary"
              />
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        <Link to="/profile" className="flex items-center space-x-3 p-2 mb-4 hover:bg-border rounded-xl transition-all group">
          <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary border border-accent-primary/30 group-hover:border-accent-primary transition-all">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{profile?.full_name || 'Sensei'}</p>
            <p className="text-xs text-muted truncate">Level {profile?.level || 1}</p>
          </div>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-2 text-muted hover:text-danger transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
};
