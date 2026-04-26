import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { LessonPage } from '@/pages/LessonPage'
import { AuthPage } from '@/pages/AuthPage'
import { PricingPage } from '@/pages/PricingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminLessonsPage } from '@/pages/AdminLessonsPage'
import { AdminModulesPage } from '@/pages/AdminModulesPage'
import { GamesPage } from '@/pages/GamesPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  AdminLayout,
  AdminGate,
  AdminDashboardPage,
  AdminUsersPage,
  AdminRolesPage,
  AdminSubscriptionsPage,
  AdminPushPage,
  AdminLogsPage,
  AdminSettingsPage,
} from '@/features/admin'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase/client'
import { useThemeStore } from '@/store/useThemeStore'
import { identifyUser, trackEvent } from '@/lib/firebase/analytics'
import { ensurePushToken, isFcmConfigured } from '@/lib/firebase/messaging'

function App() {
  const { setUser, setProfile } = useAuthStore()
  const { color } = useThemeStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', color);
  }, [color]);

  useEffect(() => {
    void trackEvent('page_view', { url: window.location.href });
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Emergency timeout to prevent stuck loading screen
      const timeoutId = setTimeout(() => {
        if (mounted) {
           console.warn("Auth initialization timed out. Proceeding as guest.");
           setProfile(null); // This stops the loading state
        }
      }, 3000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!mounted) return;
        clearTimeout(timeoutId);

        if (session) {
          setUser(session.user);
          void identifyUser(session.user.id);
          void supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => {}, () => {});
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (mounted) setProfile(profile);
        } else {
          if (mounted) setProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (mounted) {
          clearTimeout(timeoutId);
          setProfile(null);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        setUser(session.user)
        void identifyUser(session.user.id);
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (mounted) setProfile(data)
          })
        // Try to refresh the push token whenever the session changes (best-effort, never blocks UI).
        if (isFcmConfigured()) {
          void ensurePushToken().catch(() => {});
        }
      } else {
        setUser(null)
        setProfile(null)
        void identifyUser(null);
      }
    })

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [setUser, setProfile])

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background text-foreground font-sans">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lessons/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <GamesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin section: outer guard requires moderator+ (so /admin and /admin/users
                load), each individual page does its own role gate via <AdminGate />. */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="moderator">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route
                path="users"
                element={<AdminGate require="staff"><AdminUsersPage /></AdminGate>}
              />
              <Route
                path="roles"
                element={<AdminGate require="super_admin"><AdminRolesPage /></AdminGate>}
              />
              <Route
                path="subscriptions"
                element={<AdminGate require="admin"><AdminSubscriptionsPage /></AdminGate>}
              />
              <Route
                path="push"
                element={<AdminGate require="admin"><AdminPushPage /></AdminGate>}
              />
              <Route
                path="logs"
                element={<AdminGate require="super_admin"><AdminLogsPage /></AdminGate>}
              />
              <Route
                path="settings"
                element={<AdminGate require="admin"><AdminSettingsPage /></AdminGate>}
              />
            </Route>

            {/* Legacy admin sub-pages kept for compatibility */}
            <Route
              path="/admin/lessons"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminLessonsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/modules"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminModulesPage />
                </ProtectedRoute>
              }
            />

            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
