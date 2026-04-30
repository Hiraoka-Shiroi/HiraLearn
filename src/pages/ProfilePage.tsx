
import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { motion } from 'framer-motion';
import {
  User, Award, LogOut, ChevronRight, Zap, Trophy, Target, Shield,
  Flame, Clock, BookOpen, TrendingUp, Calendar, Star, Lock, ArrowRight,
  Sparkles, Brain,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';
import { billingService } from '@/features/billing/billingService';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeToggle } from '@/components/ModeToggle';
import type { Subscription, Course, Module, Lesson, UserProgress } from '@/types/database';

/* ── XP thresholds (mirrors services.ts) ─────────────────────── */
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
function xpForNextLevel(level: number): number {
  return XP_THRESHOLDS[Math.min(level, XP_THRESHOLDS.length - 1)] ?? 9999;
}
function xpForCurrentLevel(level: number): number {
  return XP_THRESHOLDS[Math.max(level - 1, 0)] ?? 0;
}

/* ── Fade-in wrapper ────────────────────────────────────────── */
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ProfilePage: React.FC = () => {
  const { profile, user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const promises: Promise<void>[] = [];

        if (user) {
          promises.push(
            billingService.getSubscription(user.id).then(setSubscription).catch(() => {}),
          );
        }

        if (profile) {
          promises.push(
            progressService.getUserProgress(profile.id).then(setProgress).catch(() => {}),
          );
        }

        const fetchedCourses = await contentCardService.getCourses().catch(() => [] as Course[]);
        setCourses(fetchedCourses);

        const modulesArr: Module[] = [];
        const lessonsArr: Lesson[] = [];
        for (const course of fetchedCourses) {
          const mods = await contentCardService.getModules(course.id).catch(() => [] as Module[]);
          modulesArr.push(...mods);
          for (const m of mods) {
            const ls = await contentCardService.getLessons(m.id).catch(() => [] as Lesson[]);
            lessonsArr.push(...ls);
          }
        }
        setAllModules(modulesArr);
        setAllLessons(lessonsArr);

        await Promise.all(promises);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, profile]);

  /* ── Derived data ────────────────────────────────────────── */
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const nextLevelXp = xpForNextLevel(level);
  const currentLevelXp = xpForCurrentLevel(level);
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const xpPercent = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

  const completedLessonIds = useMemo(() => new Set(progress.filter(p => p.status === 'completed').map(p => p.lesson_id)), [progress]);
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

  /* Course-scoped progress for learning path card */
  const courseLessons = useMemo(() => {
    if (!currentCourse) return [];
    const courseModuleIds = new Set(allModules.filter(m => m.course_id === currentCourse.id).map(m => m.id));
    return allLessons.filter(l => courseModuleIds.has(l.module_id));
  }, [currentCourse, allModules, allLessons]);
  const courseCompletedCount = useMemo(() => courseLessons.filter(l => completedLessonIds.has(l.id)).length, [courseLessons, completedLessonIds]);
  const courseTotalLessons = courseLessons.length;

  /* Weak topics = modules where user hasn't completed at least 50% */
  const weakModules = useMemo(() => {
    return allModules.filter(m => {
      const moduleLessons = allLessons.filter(l => l.module_id === m.id);
      if (moduleLessons.length === 0) return false;
      const done = moduleLessons.filter(l => completedLessonIds.has(l.id)).length;
      return done > 0 && done < moduleLessons.length * 0.5;
    }).slice(0, 3);
  }, [allModules, allLessons, completedLessonIds]);

  /* Recent activity */
  const recentActivity = useMemo(() => {
    return progress
      .filter(p => p.status === 'completed' && p.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 5)
      .map(p => {
        const lesson = allLessons.find(l => l.id === p.lesson_id);
        return { ...p, lessonTitle: lesson?.title ?? p.lesson_id, xpReward: lesson?.xp_reward ?? 0 };
      });
  }, [progress, allLessons]);

  /* Days since registration */
  const daysSinceJoin = useMemo(() => {
    if (!profile?.created_at) return 0;
    return Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
  }, [profile?.created_at]);

  /* Achievements with unlock logic */
  const achievements = useMemo(() => {
    const list: { id: string; titleKey: TranslationKey; descKey: TranslationKey; icon: React.ReactNode; unlocked: boolean; color: string }[] = [
      { id: 'first_step', titleKey: 'ach_first_step', descKey: 'ach_first_step_desc', icon: <Zap size={22} />, unlocked: completedCount >= 1, color: 'text-accent-warning' },
      { id: 'ninja', titleKey: 'ach_ninja', descKey: 'ach_ninja_desc', icon: <Target size={22} />, unlocked: completedCount >= 5, color: 'text-accent-primary' },
      { id: 'streak', titleKey: 'ach_streak', descKey: 'ach_streak_desc', icon: <Trophy size={22} />, unlocked: streak >= 3, color: 'text-accent-success' },
    ];
    return list;
  }, [completedCount, streak]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="w-8 h-8 border-[3px] border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-5 md:space-y-8 pb-4 md:pb-12">

        {/* ═══════ HERO PROFILE CARD ═══════ */}
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-surface-2 border border-border p-6 md:p-10">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent-primary/[0.06] rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-success/[0.04] rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {/* Avatar */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-xl group-hover:bg-accent-primary/30 transition-all duration-500" />
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-accent-primary/30 object-cover shadow-glow-primary"
                  />
                ) : (
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 border-4 border-accent-primary/30 flex items-center justify-center shadow-glow-primary">
                    <span className="text-4xl md:text-5xl font-black text-accent-primary">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center text-sm font-black shadow-glow-primary">
                  {level}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left min-w-0">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1 truncate">
                  {profile?.full_name || t('profile_default_name')}
                </h1>
                {profile?.username && (
                  <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>
                )}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-xs font-bold border border-accent-primary/20">
                    <TrendingUp size={12} /> {t('profile_xp_level').replace('{level}', String(level)).replace('{xp}', String(xp))}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                    subscription?.status === 'active'
                      ? 'bg-accent-success/10 text-accent-success border-accent-success/20'
                      : 'bg-surface-2 text-muted-foreground border-border'
                  }`}>
                    {subscription?.status === 'active'
                      ? (subscription.plan === 'lifetime' ? 'Lifetime' : subscription.plan)
                      : t('profile_free_plan')}
                  </span>
                  {daysSinceJoin > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-2 text-muted-foreground text-xs font-bold border border-border">
                      <Calendar size={12} /> {t('profile_days_in_hira').replace('{n}', String(daysSinceJoin))}
                    </span>
                  )}
                </div>

                {/* XP Progress bar */}
                <div className="max-w-md">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">{t('profile_xp_to_next')}</span>
                    <span className="font-bold text-accent-primary">{xpInLevel} / {xpNeeded} XP</span>
                  </div>
                  <div className="h-2.5 bg-surface-1 rounded-full overflow-hidden border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-accent-primary to-[color:var(--accent-primary)] shadow-glow-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              <StatMini icon={<Zap size={16} />} value={String(xp)} label="XP" color="text-accent-warning" />
              <StatMini icon={<Flame size={16} />} value={String(streak)} label={t('dash_streak')} color="text-orange-400" />
              <StatMini icon={<BookOpen size={16} />} value={String(completedCount)} label={t('dash_lessons_done')} color="text-accent-success" />
              <StatMini icon={<Trophy size={16} />} value={String(level)} label={t('sidebar_level')} color="text-accent-primary" />
            </div>
          </div>
        </FadeIn>

        {/* ═══════ MAIN GRID ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* ── LEFT COLUMN (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Next recommended lesson */}
            {nextLesson && (
              <FadeIn delay={0.1}>
                <div
                  onClick={() => navigate(`/lessons/${nextLesson.id}`)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-primary/10 via-card to-card border border-accent-primary/20 p-5 md:p-6 cursor-pointer hover:border-accent-primary/40 transition-all hover:shadow-glow-primary"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/[0.05] rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/15 flex items-center justify-center text-accent-primary shrink-0 group-hover:bg-accent-primary group-hover:text-white transition-all">
                      <Sparkles size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-0.5">{t('profile_next_lesson')}</p>
                      <p className="font-bold text-base truncate">{nextLesson.title}</p>
                      <p className="text-xs text-muted-foreground">+{nextLesson.xp_reward} XP</p>
                    </div>
                    <ArrowRight size={20} className="text-accent-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shrink-0" />
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Current learning path */}
            {currentCourse && (
              <FadeIn delay={0.15}>
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-accent-primary" /> {t('profile_learning_path')}
                  </h2>
                  <div className="rounded-2xl bg-card border border-border p-5 md:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{currentCourse.title}</p>
                        {currentModule && <p className="text-sm text-muted-foreground">{currentModule.title}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-accent-primary">{courseTotalLessons > 0 ? Math.round((courseCompletedCount / courseTotalLessons) * 100) : 0}%</p>
                        <p className="text-xs text-muted-foreground">{courseCompletedCount}/{courseTotalLessons}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-1 rounded-full overflow-hidden border border-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: courseTotalLessons > 0 ? `${(courseCompletedCount / courseTotalLessons) * 100}%` : '0%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-accent-success to-emerald-400"
                      />
                    </div>
                    {courseCompletedCount > 0 && courseCompletedCount < courseTotalLessons && (
                      <p className="text-xs text-muted-foreground italic">{t('profile_keep_going')}</p>
                    )}
                  </div>
                </section>
              </FadeIn>
            )}

            {/* Recent activity */}
            <FadeIn delay={0.2}>
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-accent-primary" /> {t('profile_recent_activity')}
                </h2>
                {recentActivity.length > 0 ? (
                  <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
                    {recentActivity.map((item, i) => (
                      <motion.div
                        key={`${item.lesson_id}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="p-4 flex items-center gap-3 hover:bg-card-hover transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent-success/10 flex items-center justify-center text-accent-success shrink-0">
                          <Star size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.lessonTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        {item.xpReward > 0 && (
                          <span className="text-xs font-bold text-accent-warning shrink-0">+{item.xpReward} XP</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text={t('profile_no_activity')} />
                )}
              </section>
            </FadeIn>

            {/* Weak topics */}
            {weakModules.length > 0 && (
              <FadeIn delay={0.25}>
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Brain size={18} className="text-accent-warning" /> {t('profile_weak_topics')}
                  </h2>
                  <div className="space-y-3">
                    {weakModules.map(m => {
                      const moduleLessons = allLessons.filter(l => l.module_id === m.id);
                      const done = moduleLessons.filter(l => completedLessonIds.has(l.id)).length;
                      const pct = moduleLessons.length > 0 ? Math.round((done / moduleLessons.length) * 100) : 0;
                      return (
                        <div key={m.id} className="rounded-xl bg-card border border-accent-warning/15 p-4 flex items-center gap-4 hover:border-accent-warning/30 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-accent-warning/10 flex items-center justify-center text-accent-warning shrink-0">
                            <TrendingUp size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{m.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-surface-1 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-warning rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-muted-foreground italic px-1">{t('profile_weak_hint')}</p>
                  </div>
                </section>
              </FadeIn>
            )}
          </div>

          {/* ── RIGHT COLUMN (1/3) ── */}
          <div className="space-y-6">

            {/* Streak & Motivation */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{streak}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t('profile_streak_label')}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {streak > 0 ? t('profile_streak_keep') : t('profile_streak_start')}
                </p>
              </div>
            </FadeIn>

            {/* Learning settings */}
            <FadeIn delay={0.15}>
              <section>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Target size={18} className="text-muted-foreground" /> {t('profile_settings')}
                </h2>
                <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
                  <SettingRow
                    icon={<Target size={18} />}
                    label={t('profile_goal_label')}
                    value={profile?.current_goal || 'Frontend'}
                    color="text-accent-primary bg-accent-primary/10"
                    onClick={() => navigate('/onboarding')}
                  />
                  <SettingRow
                    icon={<Clock size={18} />}
                    label={t('profile_daily_label')}
                    value={t('profile_daily_value').replace('{n}', String(profile?.daily_minutes ?? 30))}
                    color="text-accent-success bg-accent-success/10"
                    onClick={() => navigate('/onboarding')}
                  />
                  <SettingRow
                    icon={<Award size={18} />}
                    label={t('profile_style_label')}
                    value={profile?.explanation_style || '—'}
                    color="text-accent-warning bg-accent-warning/10"
                    onClick={() => navigate('/onboarding')}
                  />
                </div>
              </section>
            </FadeIn>

            {/* Achievements */}
            <FadeIn delay={0.2}>
              <section>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Award size={18} className="text-muted-foreground" /> {t('profile_achievements')}
                </h2>
                <div className="space-y-2.5">
                  {achievements.map((ach) => (
                    <motion.div
                      key={ach.id}
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-xl border p-3.5 flex items-center gap-3 transition-all ${
                        ach.unlocked
                          ? 'bg-card border-border hover:border-accent-primary/30'
                          : 'bg-surface-1 border-border/50 opacity-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        ach.unlocked ? ach.color + ' bg-surface-2' : 'text-muted-foreground bg-surface-1'
                      }`}>
                        {ach.unlocked ? ach.icon : <Lock size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${ach.unlocked ? '' : 'text-muted-foreground'}`}>{t(ach.titleKey)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{t(ach.descKey)}</p>
                      </div>
                      {ach.unlocked && (
                        <Star size={14} className="text-accent-warning ml-auto shrink-0" fill="currentColor" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            </FadeIn>

            {/* Mobile toggles (hidden on desktop where sidebar has them) */}
            <FadeIn delay={0.22}>
              <div className="flex md:hidden gap-2 px-1">
                <LanguageToggle />
                <ModeToggle />
                <ThemeToggle />
              </div>
            </FadeIn>

            {/* Actions */}
            <FadeIn delay={0.25}>
              <div className="space-y-2.5">
                {profile?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/20 text-accent-primary font-bold text-sm active:bg-accent-primary active:text-white md:hover:bg-accent-primary md:hover:text-white transition-all min-h-[48px]"
                  >
                    <Shield size={18} /> {t('profile_admin_panel')}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-accent-danger/5 border border-accent-danger/20 text-accent-danger font-bold text-sm active:bg-accent-danger active:text-white md:hover:bg-accent-danger md:hover:text-white transition-all min-h-[48px]"
                >
                  <LogOut size={18} /> {t('profile_logout')}
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

/* ── Sub-components ────────────────────────────────────────── */

const StatMini: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string }> = ({ icon, value, label, color }) => (
  <div className="flex items-center gap-3 rounded-xl bg-surface-1/80 border border-border/50 p-3">
    <div className={`shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const SettingRow: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; onClick: () => void }> = ({ icon, label, value, color, onClick }) => (
  <div onClick={onClick} className="p-4 flex items-center gap-3 active:bg-card-hover md:hover:bg-card-hover transition-colors cursor-pointer group min-h-[52px]">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-bold truncate capitalize">{value}</p>
    </div>
    <ChevronRight size={16} className="text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0" />
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl bg-surface-1 border border-border/50 p-8 text-center">
    <User size={24} className="mx-auto text-muted-foreground/50 mb-2" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);
