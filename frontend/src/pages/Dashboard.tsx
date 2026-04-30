
import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { Module, Lesson, UserProgress, Course } from '@/types/database';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, ArrowRight, Flame, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/useLanguage';
import { Avatar } from '@/components/avatar/Avatar';

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export const Dashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedCourses = await contentCardService.getCourses();
        if (fetchedCourses.length > 0) {
          const courseSlug = searchParams.get('course');
          const selectedCourse = (courseSlug
            ? fetchedCourses.find((c) => c.slug === courseSlug)
            : undefined) ?? fetchedCourses[0];
          setActiveCourse(selectedCourse);
          const fetchedModules = await contentCardService.getModules(selectedCourse.id);
          // Resolve lessons per module in parallel.
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

  // Flatten lessons in order to determine the next lesson and "locked" state.
  const flatLessons = useMemo(
    () => modulesWithLessons.flatMap(m => m.lessons),
    [modulesWithLessons],
  );

  const nextLessonId = useMemo(() => {
    for (const l of flatLessons) {
      if (!completedIds.has(l.id)) return l.id;
    }
    return null;
  }, [flatLessons, completedIds]);

  const totalLessons = flatLessons.length;
  const doneLessons = flatLessons.filter(l => completedIds.has(l.id)).length;
  const coursePct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  if (loading) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </MainLayout>
  );

  const continueHref = nextLessonId ? `/lessons/${nextLessonId}` : null;

  return (
    <MainLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-4xl mx-auto">
        {/* Header / Stats */}
        <header className="mb-6 md:mb-10 bg-gradient-to-br from-card via-card to-surface-2 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-accent-primary/[0.06] rounded-full blur-[60px] -translate-y-1/3 translate-x-1/4" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 md:gap-5 min-w-0">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                sizeClass="w-14 h-14 md:w-16 md:h-16"
              />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold mb-1 truncate">
                  {profile?.full_name || t('profile_default_name')}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-accent-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0">
                    Lvl {profile?.level || 1}
                  </span>
                  <p className="text-muted-foreground text-sm font-medium shrink-0">{profile?.xp || 0} XP</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 md:gap-6 shrink-0 w-full sm:w-auto justify-around sm:justify-start">
              <Stat icon={<Flame size={20} className="text-orange-400" />} value={profile?.streak ?? 0} label={t('dash_streak')} />
              <Stat icon={<Trophy size={18} className="text-accent-success" />} value={doneLessons} label={t('dash_lessons_done')} />
            </div>
          </div>

          {/* Course progress bar + Continue CTA */}
          {activeCourse && (
            <div className="relative z-10 mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{activeCourse.title}</span>
                  <span className="text-xs font-bold text-accent-primary">{coursePct}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-primary to-indigo-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${coursePct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
              {continueHref && (
                <Link
                  to={continueHref}
                  className="bg-accent-primary text-white rounded-xl font-bold text-sm px-4 py-3 inline-flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-accent-primary/20"
                >
                  {t('dash_continue')} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
        </header>

        {/* Path */}
        <section>
          <div className="flex items-center justify-between mb-5 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
              <BookOpen className="text-accent-primary" size={24} /> {t('dash_your_learning')}
            </h2>
          </div>

          <div className="space-y-8">
            {modulesWithLessons.map((module, idx) => (
              <ModulePath
                key={module.id}
                module={module}
                index={idx}
                completedIds={completedIds}
                nextLessonId={nextLessonId}
              />
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string }> = ({ icon, value, label }) => (
  <div className="text-center">
    <div className="flex items-center gap-1.5 font-black text-xl">
      {icon} {value}
    </div>
    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
  </div>
);

interface ModulePathProps {
  module: ModuleWithLessons;
  index: number;
  completedIds: Set<string>;
  nextLessonId: string | null;
}

const ModulePath: React.FC<ModulePathProps> = ({ module, index, completedIds, nextLessonId }) => {
  const { t } = useLanguage();
  const total = module.lessons.length;
  const done = module.lessons.filter(l => completedIds.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const moduleStarted = done > 0 || module.lessons.some(l => l.id === nextLessonId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {/* Module header */}
      <div className="flex items-center gap-3 md:gap-4 mb-5">
        <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-lg border-2 ${
          done === total && total > 0
            ? 'bg-accent-success text-white border-accent-success/40 shadow-glow-success'
            : moduleStarted
              ? 'bg-card text-accent-primary border-accent-primary/40 shadow-glow-primary'
              : 'bg-card text-muted-foreground border-border'
        }`}>
          {done === total && total > 0 ? <CheckCircle2 size={22} /> : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-black truncate">{module.title}</h3>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden max-w-[180px]">
              <div className="h-full bg-accent-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              {done}/{total} {t('dashboard_lessons')}
            </span>
          </div>
        </div>
      </div>

      {/* Lesson nodes — vertical track */}
      <ol className="relative pl-2 md:pl-6">
        {/* vertical track line */}
        <span className="absolute left-[27px] md:left-[31px] top-3 bottom-3 w-[2px] bg-border" aria-hidden />
        {module.lessons.map((lesson, i) => {
          const isCompleted = completedIds.has(lesson.id);
          const isCurrent = lesson.id === nextLessonId;
          const isLocked = !isCompleted && !isCurrent;
          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              order={i + 1}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isLocked={isLocked}
            />
          );
        })}
      </ol>
    </motion.div>
  );
};

interface LessonNodeProps {
  lesson: Lesson;
  order: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

const LessonNode: React.FC<LessonNodeProps> = ({ lesson, order, isCompleted, isCurrent, isLocked }) => {
  const { t } = useLanguage();

  const dotColor = isCompleted
    ? 'bg-accent-success text-white shadow-glow-success'
    : isCurrent
      ? 'bg-accent-primary text-white shadow-glow-primary'
      : 'bg-surface-1 text-muted-foreground border-2 border-dashed border-border';

  const cardColor = isCompleted
    ? 'bg-accent-success/5 border-accent-success/15 hover:border-accent-success/30'
    : isCurrent
      ? 'bg-card border-accent-primary/40 hover:border-accent-primary/60 shadow-glow-primary'
      : 'bg-card/60 border-border opacity-80';

  const inner = (
    <li className="relative pl-12 md:pl-14 pb-4 last:pb-0">
      {/* node dot */}
      <span
        className={`absolute left-0 top-1.5 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${dotColor}`}
      >
        {isCurrent && (
          <motion.span
            className="absolute inset-0 rounded-full bg-accent-primary/30"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {isCompleted ? <CheckCircle2 size={18} /> : isLocked ? <Lock size={14} /> : order}
      </span>

      <div
        className={`block p-4 md:p-4 rounded-xl border transition-all ${cardColor} min-h-[60px]`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-sm mb-0.5 truncate">{lesson.title}</h4>
            <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isCompleted ? 'text-accent-success' : isCurrent ? 'text-accent-primary' : 'text-muted-foreground'
            }`}>
              {isCompleted ? (<>{t('lesson_done')}</>) :
               isCurrent ? (<><Sparkles size={11} /> {t('dash_continue')}</>) :
               <>+{lesson.xp_reward} XP</>}
            </p>
          </div>
          <ArrowRight size={16} className={isLocked ? 'text-muted-foreground/40' : 'text-accent-primary'} />
        </div>
      </div>
    </li>
  );

  if (isLocked) return inner;

  return (
    <Link to={`/lessons/${lesson.id}`} className="block">
      {inner}
    </Link>
  );
};
