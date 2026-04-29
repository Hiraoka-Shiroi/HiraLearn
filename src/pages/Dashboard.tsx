
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { Module, Lesson, UserProgress, Course } from '@/types/database';
import { motion } from 'framer-motion';
import { BookOpen, Star, Trophy, ArrowRight, Flame } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/useLanguage';

export const Dashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [modules, setModules] = useState<Module[]>([]);
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
          setModules(fetchedModules);
        }

        if (profile) {
          const fetchedProgress = await progressService.getUserProgress(profile.id);
          setProgress(fetchedProgress);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, searchParams]);

  if (loading) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto">
        {/* Header / Stats */}
        <header className="mb-10 bg-gradient-to-br from-card via-card to-surface-2 p-6 md:p-8 rounded-3xl border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-accent-primary/[0.05] rounded-full blur-[60px] -translate-y-1/3 translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-2xl border-2 border-accent-primary/20 object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 rounded-2xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                  <span className="text-2xl font-black">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold mb-1 truncate">{profile?.full_name || t('profile_default_name')}</h1>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-accent-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shrink-0">Lvl {profile?.level || 1}</span>
                  <p className="text-muted-foreground text-sm font-medium shrink-0">{profile?.xp || 0} XP</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6 shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-accent-warning font-black text-xl">
                  <Flame size={20} className="text-orange-400" /> {profile?.streak ?? 0}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('dash_streak')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-accent-success font-black text-xl">
                  <Trophy size={18} /> {progress.length}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('dash_lessons_done')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Course Map */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
              <BookOpen className="text-accent-primary" size={24} /> {t('dash_your_learning')}
            </h2>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{activeCourse?.title ?? t('dash_html_path')}</span>
          </div>

          <div className="space-y-12 relative">
            <div className="absolute left-9 top-10 bottom-10 w-px bg-border hidden md:block" />

            {modules.map((module, idx) => (
              <ModuleSection
                key={module.id}
                module={module}
                index={idx}
                progress={progress}
              />
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

const ModuleSection: React.FC<{ module: Module, index: number, progress: UserProgress[] }> = ({ module, index, progress }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    contentCardService.getLessons(module.id).then(setLessons);
  }, [module.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative z-10"
    >
      <div className="flex items-center gap-6 mb-8">
        <div className="w-[72px] h-[72px] shrink-0 bg-card border-2 border-accent-primary/30 rounded-2xl flex items-center justify-center text-accent-primary font-black text-xl shadow-glow-primary">
          {index + 1}
        </div>
        <div>
          <h3 className="text-xl font-black mb-0.5">{module.title}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{lessons.length} {t('dashboard_lessons')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-24">
        {lessons.map((lesson) => {
          const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.status === 'completed');
          return (
            <Link
              to={`/lessons/${lesson.id}`}
              key={lesson.id}
              className={`p-5 rounded-2xl border transition-all flex items-center justify-between group relative overflow-hidden ${
                isCompleted
                ? 'bg-accent-success/5 border-accent-success/15 hover:border-accent-success/30'
                : 'bg-card border-border hover:border-accent-primary/30 hover:shadow-glow-primary'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  isCompleted
                  ? 'bg-accent-success text-white shadow-glow-success'
                  : 'bg-surface-1 text-muted-foreground group-hover:bg-accent-primary group-hover:text-white group-hover:shadow-glow-primary'
                }`}>
                  {isCompleted ? <Star size={18} fill="currentColor" /> : <BookOpen size={18} />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm mb-0.5 truncate">{lesson.title}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-accent-success' : 'text-muted-foreground'}`}>
                    {isCompleted ? t('lesson_done') : `+${lesson.xp_reward} XP`}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-accent-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shrink-0" />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};
