
import React, { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import { Course, UserProgress } from '@/types/database';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import {
  Book, Layout, ArrowRight, Trash2, Eye, EyeOff,
  Palette, Smartphone, Braces, MousePointer, Atom, FileCode,
  GitBranch, Cloud, Database, FolderKanban, BookOpen, Clock,
  Search, CheckCircle2, Play, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';

const COURSE_ICONS: Record<string, React.ReactNode> = {
  'html-basics': <Layout size={28} />,
  'css-basics': <Palette size={28} />,
  'responsive-layout': <Smartphone size={28} />,
  'javascript-basics': <Braces size={28} />,
  'js-basics': <Braces size={28} />,
  'dom-events': <MousePointer size={28} />,
  'react-basics': <Atom size={28} />,
  'typescript-basics': <FileCode size={28} />,
  'git-github': <GitBranch size={28} />,
  'api-basics': <Cloud size={28} />,
  'supabase-firebase-basics': <Database size={28} />,
  'backend-basics': <Database size={28} />,
  'frontend-projects': <FolderKanban size={28} />,
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-accent-success/10 text-accent-success border-accent-success/20',
  intermediate: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20',
  advanced: 'bg-accent-danger/10 text-accent-danger border-accent-danger/20',
};

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface CourseStats {
  totalLessons: number;
  completedLessons: number;
  firstUncompletedLessonId: string | null;
}

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Record<string, CourseStats>>({});
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = profile?.role === 'admin';

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        let fetchedCourses: Course[];
        if (isAdmin) {
          // Admins see drafts too. Try ordering by order_index, fall back to created_at.
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('order_index', { ascending: true });
          if (error) {
            const fallback = await supabase.from('courses').select('*').order('created_at');
            fetchedCourses = (fallback.data as Course[]) || [];
          } else {
            fetchedCourses = (data as Course[]) || [];
          }
        } else {
          fetchedCourses = await contentCardService.getCourses();
        }
        setCourses(fetchedCourses);

        // Compute lesson totals + per-course completion in parallel.
        const userId = profile?.id;
        const userProgressP: Promise<UserProgress[]> = userId
          ? progressService.getUserProgress(userId).catch(() => [] as UserProgress[])
          : Promise.resolve([] as UserProgress[]);

        const courseStats: Record<string, CourseStats> = {};
        const allModulesByCourse = await Promise.all(
          fetchedCourses.map(async (course) => {
            const mods = await contentCardService.getModules(course.id).catch(() => []);
            const lessonsByModule = await Promise.all(
              mods.map((m) => contentCardService.getLessons(m.id).catch(() => [])),
            );
            const lessons = lessonsByModule.flat();
            return { course, lessons };
          }),
        );

        const userProgress = await userProgressP;
        const completedSet = new Set(
          userProgress.filter((p) => p.status === 'completed').map((p) => p.lesson_id),
        );

        for (const { course, lessons } of allModulesByCourse) {
          let firstUncompleted: string | null = null;
          let completed = 0;
          for (const lesson of lessons) {
            if (completedSet.has(lesson.id)) {
              completed += 1;
            } else if (firstUncompleted === null) {
              firstUncompleted = lesson.id;
            }
          }
          courseStats[course.id] = {
            totalLessons: lessons.length,
            completedLessons: completed,
            firstUncompletedLessonId: firstUncompleted,
          };
        }
        setStats(courseStats);
      } finally {
        setLoading(false);
      }
    };
    void loadCourses();
  }, [isAdmin, profile?.id]);

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(t('common_delete') + '?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) {
      alert(t('common_error') + ': ' + error.message);
      return;
    }
    const { data: check } = await supabase.from('courses').select('id').eq('id', courseId).maybeSingle();
    if (check) {
      alert(t('admin_rls_error'));
      return;
    }
    setCourses(courses.filter((c) => c.id !== courseId));
  };

  const handleTogglePublish = async (course: Course) => {
    const newVal = !course.is_published;
    const { data, error } = await supabase
      .from('courses')
      .update({ is_published: newVal })
      .eq('id', course.id)
      .select('is_published')
      .single();
    if (error) {
      alert(t('common_error') + ': ' + error.message);
      return;
    }
    if (data && data.is_published !== newVal) {
      alert(t('admin_rls_error'));
      return;
    }
    setCourses(courses.map((c) => c.id === course.id ? { ...c, is_published: newVal } : c));
  };

  const getCourseIcon = (slug: string) => COURSE_ICONS[slug] ?? <Book size={28} />;

  const getLevelKey = (level: string): string => {
    if (level === 'beginner') return 'courses_beginner';
    if (level === 'intermediate') return 'courses_intermediate';
    if (level === 'advanced') return 'courses_advanced';
    return 'courses_beginner';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      if (q) {
        const hay = `${c.title} ${c.description ?? ''} ${c.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [courses, levelFilter, search]);

  const filterButtons: { key: LevelFilter; labelKey: string }[] = [
    { key: 'all', labelKey: 'courses_filter_all' },
    { key: 'beginner', labelKey: 'courses_beginner' },
    { key: 'intermediate', labelKey: 'courses_intermediate' },
    { key: 'advanced', labelKey: 'courses_advanced' },
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <header className="mb-5 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">{t('courses_title')}</h1>
          <p className="text-muted-foreground font-medium">{t('courses_subtitle')}</p>
        </header>

        {/* Filters + search */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('courses_search_placeholder')}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent-primary min-h-[44px]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 sm:overflow-visible">
            {filterButtons.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setLevelFilter(key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors min-h-[44px] shrink-0 ${
                  levelFilter === key
                    ? 'bg-accent-primary text-white border-accent-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(labelKey as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            {t('courses_empty_filtered')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            {filtered.map((course) => {
              const cs = stats[course.id] ?? { totalLessons: 0, completedLessons: 0, firstUncompletedLessonId: null };
              const pct = cs.totalLessons > 0 ? Math.round((cs.completedLessons / cs.totalLessons) * 100) : 0;
              const isCompleted = cs.totalLessons > 0 && cs.completedLessons === cs.totalLessons;
              const hasStarted = cs.completedLessons > 0;
              const levelStyle = LEVEL_COLORS[course.level] ?? LEVEL_COLORS.beginner;
              const isComingSoon = !course.is_published && !isAdmin;
              const ctaTarget = cs.firstUncompletedLessonId
                ? `/lessons/${cs.firstUncompletedLessonId}`
                : `/dashboard?course=${course.slug}`;

              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4 }}
                  className={`bg-card border border-border rounded-2xl md:rounded-[2rem] p-5 md:p-7 flex flex-col transition-all group relative overflow-hidden ${
                    isComingSoon ? 'opacity-70' : 'active:border-accent-primary md:hover:border-accent-primary'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-8 text-accent-primary/5 group-hover:scale-110 transition-transform duration-700">
                    {getCourseIcon(course.slug)}
                  </div>

                  <div className="flex items-start gap-4 mb-4 md:mb-5">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-accent-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-accent-primary shrink-0 border border-accent-primary/20">
                      {getCourseIcon(course.slug)}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelStyle}`}>
                        {t(getLevelKey(course.level) as Parameters<typeof t>[0])}
                      </span>
                      {cs.totalLessons > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-2 text-muted-foreground border border-border">
                          <BookOpen size={10} /> {cs.completedLessons}/{cs.totalLessons}
                        </span>
                      )}
                      {!course.is_published && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-warning/10 text-accent-warning border border-accent-warning/20">
                          <Clock size={10} /> {t('courses_coming_soon')}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-success/10 text-accent-success border border-accent-success/20">
                          <CheckCircle2 size={10} /> {t('lesson_done')}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg md:text-xl font-black mb-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
                    {course.description || t('courses_default_desc')}
                  </p>

                  {/* Progress bar */}
                  {cs.totalLessons > 0 && !isComingSoon && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t('courses_progress_label')}
                        </span>
                        <span className="text-[11px] font-bold text-accent-primary">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full transition-all ${isCompleted ? 'bg-accent-success' : 'bg-accent-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isAdmin && !course.is_published && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-border px-2 py-0.5 rounded-full mb-3 inline-block">
                      {t('admin_draft')}
                    </span>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTogglePublish(course); }}
                            className="p-2 rounded-xl hover:bg-border text-muted hover:text-foreground transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                            title={course.is_published ? t('admin_unpublish') : t('admin_publish')}
                          >
                            {course.is_published ? <EyeOff size={16} /> : <Eye size={16} className="text-accent-success" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                            className="p-2 rounded-xl hover:bg-accent-danger/10 text-muted hover:text-accent-danger transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                            title={t('common_delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {course.is_published ? (
                      isCompleted ? (
                        <button
                          onClick={() => navigate(`/dashboard?course=${course.slug}`)}
                          className="bg-accent-success/10 text-accent-success border border-accent-success/30 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 min-h-[44px]"
                        >
                          <Sparkles size={14} /> {t('lesson_done')}
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(ctaTarget)}
                          className="bg-accent-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-accent-primary/20 min-h-[44px]"
                        >
                          {hasStarted ? (<><Play size={14} fill="currentColor" /> {t('dash_continue')}</>) :
                                        (<>{t('courses_start_btn')} <ArrowRight size={16} /></>)}
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {t('courses_coming_soon')}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
