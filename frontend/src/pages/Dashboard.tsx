/**
 * Dashboard — the home screen for a logged-in learner.
 *
 * Layout:
 *  1. `<DashboardHero>`    — mascot + greeting + XP progress + big CTA.
 *  2. `<QuickActivities>`  — four navigation tiles (courses/arcade/...).
 *  3. `<DailyGoalCard>` + `<WeekStreak>` — two motivational widgets.
 *  4. `<CurrentCourseCard>` — compact snapshot of the active course.
 *  5. `<LearningPath>`     — per-module lesson ladder.
 *  6. `<PopularCourses>`   — horizontally-scrolling "try another path".
 *
 * The page fetches courses + modules + lessons + user progress exactly
 * once per `profile` change. Data is memoised before being passed to
 * dumb presentational components.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { contentCardService, progressService } from '@/lib/supabase/services';
import type { Module, Lesson, UserProgress, Course } from '@/types/database';
import {
  getCurrentLevelXp,
  getLevelProgress,
  getNextLevelXp,
  isMaxLevel,
} from '@/lib/progress/levels';
import { BookOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/useLanguage';
import { DashboardHero } from '@/features/dashboard/DashboardHero';
import { QuickActivities } from '@/features/dashboard/QuickActivities';
import { DailyGoalCard } from '@/features/dashboard/DailyGoalCard';
import { WeekStreak } from '@/features/dashboard/WeekStreak';
import { CurrentCourseCard } from '@/features/dashboard/CurrentCourseCard';
import { PopularCourses } from '@/features/dashboard/PopularCourses';
import { LearningPath, type ModuleWithLessons } from '@/features/dashboard/LearningPath';

export const Dashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedCourses = await contentCardService.getCourses();
        setAllCourses(fetchedCourses);

        if (fetchedCourses.length > 0) {
          const courseSlug = searchParams.get('course');
          const selectedCourse = (courseSlug
            ? fetchedCourses.find((c) => c.slug === courseSlug)
            : undefined) ?? fetchedCourses[0];
          setActiveCourse(selectedCourse);

          const fetchedModules = await contentCardService.getModules(selectedCourse.id);
          const withLessons = await Promise.all(
            fetchedModules.map(async (m) => ({
              ...m,
              lessons: await contentCardService.getLessons(m.id).catch(() => [] as Lesson[]),
            })),
          );
          setModulesWithLessons(withLessons);
        }

        if (profile) {
          const fetchedProgress = await progressService.getUserProgress(profile.id);
          setProgress(fetchedProgress);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile, searchParams]);

  const completedIds = useMemo(
    () => new Set(progress.filter(p => p.status === 'completed').map(p => p.lesson_id)),
    [progress],
  );

  const flatLessons: Lesson[] = useMemo(
    () => modulesWithLessons.flatMap(m => m.lessons),
    [modulesWithLessons],
  );

  const nextLessonId = useMemo(() => {
    for (const l of flatLessons) {
      if (!completedIds.has(l.id)) return l.id;
    }
    return null;
  }, [flatLessons, completedIds]);

  const nextLesson = useMemo(
    () => flatLessons.find(l => l.id === nextLessonId) ?? null,
    [flatLessons, nextLessonId],
  );

  const currentModule: Module | null = useMemo(() => {
    if (!nextLesson) return modulesWithLessons[modulesWithLessons.length - 1] ?? null;
    return modulesWithLessons.find(m => m.id === nextLesson.module_id) ?? null;
  }, [nextLesson, modulesWithLessons]);

  // ── derived stats ───────────────────────────────────────────────
  const totalLessons = flatLessons.length;
  const doneLessons = flatLessons.filter(l => completedIds.has(l.id)).length;

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const currentLevelXp = getCurrentLevelXp(level);
  const nextLevelXp = isMaxLevel(level) ? xp : getNextLevelXp(level);
  const xpInLevel = Math.max(0, xp - currentLevelXp);
  const xpNeeded = isMaxLevel(level) ? 0 : Math.max(1, nextLevelXp - currentLevelXp);
  const xpPercent = isMaxLevel(level) ? 100 : Math.round(getLevelProgress(xp, level) * 100);

  // "Lessons done today" — approximate, based on the last-completed
  // record timestamps we already have in memory. Good enough for UX.
  const lessonsDoneToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return progress.filter(p =>
      p.status === 'completed'
      && p.completed_at
      && new Date(p.completed_at).getTime() >= startOfDay.getTime(),
    ).length;
  }, [progress]);

  const continueHref = nextLessonId ? `/lessons/${nextLessonId}` : null;

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-5 md:space-y-8">
        <DashboardHero
          level={level}
          xp={xp}
          xpInLevel={xpInLevel}
          xpNeeded={xpNeeded}
          xpPercent={xpPercent}
          continueHref={continueHref}
          continueTitle={nextLesson?.title}
        />

        <QuickActivities />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <DailyGoalCard
            dailyMinutes={profile?.daily_minutes ?? 30}
            hasStreakToday={streak > 0 && lessonsDoneToday > 0}
            lessonsDoneToday={lessonsDoneToday}
          />
          <WeekStreak streak={streak} />
        </div>

        <CurrentCourseCard
          course={activeCourse}
          module={currentModule}
          completed={doneLessons}
          total={totalLessons}
          nextLessonId={nextLessonId}
        />

        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2.5">
              <BookOpen className="text-accent-primary" size={24} /> {t('dash_your_learning')}
            </h2>
            {activeCourse && (
              <span className="text-xs font-bold text-muted-foreground">
                {doneLessons}/{totalLessons} {t('dashboard_lessons')}
              </span>
            )}
          </div>

          <LearningPath
            modules={modulesWithLessons}
            completedIds={completedIds}
            nextLessonId={nextLessonId}
          />
        </section>

        <PopularCourses courses={allCourses} activeCourseId={activeCourse?.id} />
      </div>
    </MainLayout>
  );
};
