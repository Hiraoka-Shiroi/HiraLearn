import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import type { Role } from '@/types/database';
import { hasRole, isAdmin } from '@/features/admin/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Legacy: equivalent to requireRole='admin'. */
  adminOnly?: boolean;
  /** Minimum role required to access this route. */
  requireRole?: Role;
}

export const ProtectedRoute = ({
  children,
  adminOnly = false,
  requireRole,
}: ProtectedRouteProps) => {
  const { user, profile, loading, setUser, setProfile } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
    };
    if (!user) checkUser();
  }, [user, setUser, setProfile]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-accent-primary/20" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.status === 'banned') {
    return <Navigate to="/login?banned=1" replace />;
  }

  // Onboarding gate (skipped for admin views and admin-level users — admins
  // and super_admins shouldn't be forced through the learner onboarding flow).
  const onboardingDone = (() => {
    try {
      return localStorage.getItem('hiralearn_onboarding_done') === '1';
    } catch {
      return false;
    }
  })();
  const isIncomplete = !profile?.current_goal && !onboardingDone;
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAdminUser = isAdmin(profile);
  if (
    isIncomplete &&
    location.pathname !== '/onboarding' &&
    !isAdminPath &&
    !isAdminUser
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  const minRole: Role | null = requireRole ?? (adminOnly ? 'admin' : null);
  if (minRole && !hasRole(profile, minRole)) {
    // Special case: legacy adminOnly should also accept moderator viewing read-only,
    // but we keep strict admin gating for compatibility. Use requireRole='moderator' for
    // moderator-accessible pages.
    if (adminOnly && isAdmin(profile)) {
      // ok
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
