
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { LessonPage } from '@/pages/LessonPage'
import { AuthPage } from '@/pages/AuthPage'
import { PricingPage } from '@/pages/PricingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'
import { GamesPage } from '@/pages/GamesPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase/client'
import { useThemeStore } from '@/store/useThemeStore'

function App() {
  const { setUser, setProfile } = useAuthStore()
  const { color } = useThemeStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', color);
  }, [color]);

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
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (mounted) setProfile(data)
          })
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [setUser, setProfile])

  return (
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

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
