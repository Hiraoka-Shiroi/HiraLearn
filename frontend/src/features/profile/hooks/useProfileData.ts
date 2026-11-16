import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { billingService } from '@/features/billing/billingService';
import type { Subscription, Course, Module, Lesson, UserProgress } from '@/types/database';
import { TranslationKey } from '@/i18n/translations';
import {
  getCurrentLevelXp,
  getLevelProgress,
  getNextLevelXp,
  isMaxLevel,
} from '@/lib/progress/levels';
import { Zap, Target, Trophy } from 'lucide-react';
import React from 'react';

export interface Achievement {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: React.ReactNode;
  unlocked: boolean;
  color: string;
}

export interface RecentActivityItem extends UserProgress {
  lessonTitle: string;
  xpReward: number;
}

export function useProfileData() {
  const { profile, user } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Независимые запросы — запускаем сразу параллельно
        const parallel: Promise<unknown>[] = [];
        if (user) {
          parallel.push(
            billingService.getSubscription(user.id).then(setSubscription).catch(() => {}),
          );
        }
        if (profile) {
          parallel.push(
            progressService.getUserProgress(profile.id).then(setProgress).catch(() => {}),
          );
        }

        // Курсы
        const fetchedCourses = await contentCardService.getCourses().catch(() => [] as Course[]);
        if (cancelled) return;
        setCourses(fetchedCourses);

        // ВСЕ модули по всем курсам — ОДНОВРЕМЕННО (а не последовательно в цикле)
        const modulesNested = await Promise.all(
          fetchedCourses.map(c =>
            contentCardService.getModules(c.id).catch(() => [] as Module[]),
          ),
        );
        if (cancelled) return;
        const modulesArr: Module[] = modulesNested.flat();
        setAllModules(modulesArr);

        // ВСЕ уроки по всем модулям — ОДНОВРЕМЕННО
        const lessonsNested = await Promise.all(
          modulesArr.map(m =>
            contentCardService.getLessons(m.id).catch(() => [] as Lesson[]),
          ),
        );
        if (cancelled) return;
        const lessonsArr: Lesson[] = lessonsNested.flat();
        setAllLessons(lessonsArr);

        await Promise.all(parallel);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, profile]);

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const currentLevelXp = getCurrentLevelXp(level);
  const nextLevelXp = isMaxLevel(level) ? xp : getNextLevelXp(level);
  const xpInLevel = Math.max(0, xp - currentLevelXp);
  const xpNeeded = isMaxLevel(level) ? 0 : Math.max(1, nextLevelXp - currentLevelXp);
  const xpPercent = isMaxLevel(level) ? 100 : Math.round(getLevelProgress(xp, level) * 100);

  const completedLessonIds = useMemo(
    () => new Set(progress.filter(p => p.status === 'completed').map(p => p.lesson_id)),
    [progress],
  );
  const completedCount = completedLessonIds.size;

  const nextLesson = useMemo(() => {
    for (const lesson of allLessons) {
      if (!completedLessonIds.has(lesson.id)) return lesson;
    }
    return null;
  }, [allLessons, completedLessonIds]);

  const currentModule = useMemo(() => {
    if (!nextLesson) return allModules[allModules.length - 1] ?? null;
    return allModules.find(m => m.id === nextLesson.module_id) ?? null;
  }, [nextLesson, allModules]);

  const currentCourse = useMemo(() => {
    if (!currentModule) return courses[0] ?? null;
    return courses.find(c => c.id === currentModule.course_id) ?? null;
  }, [currentModule, courses]);

  const courseLessons = useMemo(() => {
    if (!currentCourse) return [];
    const courseModuleIds = new Set(allModules.filter(m => m.course_id === currentCourse.id).map(m => m.id));
    return allLessons.filter(l => courseModuleIds.has(l.module_id));
  }, [currentCourse, allModules, allLessons]);

  const courseCompletedCount = useMemo(
    () => courseLessons.filter(l => completedLessonIds.has(l.id)).length,
    [courseLessons, completedLessonIds],
  );
  const courseTotalLessons = courseLessons.length;

  const weakModules = useMemo(() => {
    return allModules.filter(m => {
      const moduleLessons = allLessons.filter(l => l.module_id === m.id);
      if (moduleLessons.length === 0) return false;
      const done = moduleLessons.filter(l => completedLessonIds.has(l.id)).length;
      return done > 0 && done < moduleLessons.length * 0.5;
    }).slice(0, 3);
  }, [allModules, allLessons, completedLessonIds]);

  const recentActivity: RecentActivityItem[] = useMemo(() => {
    return progress
      .filter(p => p.status === 'completed' && p.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 5)
      .map(p => {
        const lesson = allLessons.find(l => l.id === p.lesson_id);
        return { ...p, lessonTitle: lesson?.title ?? p.lesson_id, xpReward: lesson?.xp_reward ?? 0 };
      });
  }, [progress, allLessons]);

  const daysSinceJoin = useMemo(() => {
    if (!profile?.created_at) return 0;
    return Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
  }, [profile?.created_at]);

  const achievements: Achievement[] = useMemo(() => [
    { id: 'first_step', titleKey: 'ach_first_step', descKey: 'ach_first_step_desc', icon: React.createElement(Zap, { size: 22 }), unlocked: completedCount >= 1, color: 'text-accent-warning' },
    { id: 'ninja', titleKey: 'ach_ninja', descKey: 'ach_ninja_desc', icon: React.createElement(Target, { size: 22 }), unlocked: completedCount >= 5, color: 'text-accent-primary' },
    { id: 'streak', titleKey: 'ach_streak', descKey: 'ach_streak_desc', icon: React.createElement(Trophy, { size: 22 }), unlocked: streak >= 3, color: 'text-accent-success' },
  ], [completedCount, streak]);

  return {
    loading,
    subscription,
    level, xp, streak,
    xpInLevel, xpNeeded, xpPercent,
    completedCount, completedLessonIds,
    nextLesson, currentCourse,
    currentModule,
    courseCompletedCount, courseTotalLessons,
    weakModules,
    recentActivity,
    daysSinceJoin,
    achievements,
    allLessons,
  };
}
