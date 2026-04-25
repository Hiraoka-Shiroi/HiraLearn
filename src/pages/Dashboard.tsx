
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { Module, Lesson, UserProgress } from '@/types/database';
import { motion } from 'framer-motion';
import { BookOpen, Star, Zap, Trophy, User as UserIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/i18n/useLanguage';

export const Dashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { t } = useLanguage();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedCourses = await contentCardService.getCourses();

        if (fetchedCourses.length > 0) {
          const fetchedModules = await contentCardService.getModules(fetchedCourses[0].id);
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
  }, [profile]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-accent-primary font-bold text-xl uppercase tracking-widest">{t('dash_loading')}</div>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        {/* Header / Stats */}
        <header className="mb-12 flex flex-col md:flex-row items-center justify-between bg-card p-8 rounded-[2.5rem] border border-border shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-accent-primary/5 group-hover:scale-110 transition-transform duration-700">
             <UserIcon size={120} />
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-accent-primary/10 rounded-3xl flex items-center justify-center text-accent-primary border border-accent-primary/20 shadow-inner">
               <UserIcon size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{profile?.full_name || 'Ученик'}</h1>
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 bg-accent-primary text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">Lvl {profile?.level || 1}</span>
                 <p className="text-muted-foreground text-sm font-medium">{profile?.xp || 0} XP Набрано</p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 mt-8 md:mt-0 relative z-10">
            <div className="text-center">
              <div className="flex items-center gap-2 text-accent-warning font-black text-2xl">
                <Zap size={24} fill="currentColor" /> {profile?.streak ?? 0}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('dash_streak')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-accent-success font-black text-2xl">
                <Trophy size={24} /> {progress.length}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('dash_lessons_done')}</p>
            </div>
          </div>
        </header>

        {/* Course Map */}
        <section>
          <div className="flex items-center justify-between mb-10">
             <h2 className="text-2xl font-bold flex items-center gap-3">
               <BookOpen className="text-accent-primary" size={28} /> {t('dash_your_learning')}
             </h2>
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('dash_html_path')}</span>
          </div>

          <div className="space-y-16 relative">
            {/* Vertical line connector */}
            <div className="absolute left-10 top-10 bottom-10 w-1.5 bg-border rounded-full hidden md:block" />

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
      <div className="flex items-center gap-8 mb-10">
        <div className="w-20 h-20 bg-card border-4 border-accent-primary rounded-[2rem] flex items-center justify-center text-accent-primary font-black text-2xl shadow-2xl shadow-accent-primary/10">
          {index + 1}
        </div>
        <div>
          <h3 className="text-2xl font-black mb-1">{module.title}</h3>
          <div className="flex items-center gap-2">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-border border-2 border-card" />)}
             </div>
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{lessons.length} Уроков мастерства</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-28">
        {lessons.map((lesson) => {
          const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.status === 'completed');
          return (
            <Link
              to={`/lessons/${lesson.id}`}
              key={lesson.id}
              className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between group relative overflow-hidden ${
                isCompleted
                ? 'bg-accent-success/5 border-accent-success/20 hover:border-accent-success/40'
                : 'bg-card border-border hover:border-accent-primary/40'
              }`}
            >
              <div className="flex items-center gap-5 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isCompleted
                  ? 'bg-accent-success text-white shadow-lg shadow-accent-success/20'
                  : 'bg-background text-muted-foreground group-hover:bg-accent-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent-primary/20'
                }`}>
                  {isCompleted ? <Star size={22} fill="currentColor" /> : <BookOpen size={22} />}
                </div>
                <div>
                  <h4 className="font-bold text-base mb-0.5">{lesson.title}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-accent-success' : 'text-muted-foreground'}`}>
                    {isCompleted ? 'Завершено' : `+${lesson.xp_reward} XP`}
                  </p>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 relative z-10">
                <ArrowRight size={20} className="text-accent-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};
