import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StatsGrid } from '@/components/StatsGrid';
import { ProgressCard } from '@/components/ProgressCard';
import { RoadmapPath } from '@/components/RoadmapPath';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useStore } from '@/store/useStore';
import { LessonService } from '@/features/lessons/LessonService';

export const DashboardPage = () => {
  const { user, profile } = useAuthStore();
  const { fetchUserProgress } = useStore();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
      LessonService.getCourses().then(setCourses);
    }
  }, [user, fetchUserProgress]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              Welcome back, {profile?.full_name || 'Sensei'}.
            </h1>
            <p className="text-muted">You're making steady progress on your {profile?.current_goal || 'frontend'} path.</p>
          </motion.div>
        </header>

        <div className="space-y-8 max-w-6xl mx-auto">
          <StatsGrid />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {courses.length > 0 ? (
                <ProgressCard courseId={courses[0].id} />
              ) : (
                <div className="p-12 rounded-[2rem] border border-dashed border-border flex items-center justify-center text-muted italic">
                  No active courses found. Admin needs to publish some!
                </div>
              )}

              <div className="mt-8 p-6 rounded-2xl bg-accent-primary/5 border border-accent-primary/10 flex items-start space-x-4">
                <div className="text-2xl mt-1">💡</div>
                <div>
                  <h4 className="font-bold text-accent-primary mb-1 text-sm uppercase tracking-widest">Sensei's Tip</h4>
                  <p className="text-sm text-muted italic leading-relaxed">
                    "Great structures are built from small, precise tags. A clean semantic foundation makes styling 10x easier."
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              {courses.length > 0 && <RoadmapPath courseId={courses[0].id} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
