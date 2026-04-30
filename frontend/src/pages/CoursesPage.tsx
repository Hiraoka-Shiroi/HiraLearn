
import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { contentCardService } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/database';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import {
  Book, Layout, ArrowRight, Trash2, Eye, EyeOff,
  Palette, Smartphone, Braces, MousePointer, Atom, FileCode,
  GitBranch, Cloud, Database, FolderKanban, BookOpen, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';

const COURSE_ICONS: Record<string, React.ReactNode> = {
  'html-basics': <Layout size={28} />,
  'css-basics': <Palette size={28} />,
  'responsive-layout': <Smartphone size={28} />,
  'js-basics': <Braces size={28} />,
  'dom-events': <MousePointer size={28} />,
  'react-basics': <Atom size={28} />,
  'typescript-basics': <FileCode size={28} />,
  'git-github': <GitBranch size={28} />,
  'api-basics': <Cloud size={28} />,
  'backend-basics': <Database size={28} />,
  'frontend-projects': <FolderKanban size={28} />,
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-accent-success/10 text-accent-success border-accent-success/20',
  intermediate: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20',
  advanced: 'bg-accent-danger/10 text-accent-danger border-accent-danger/20',
};

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const loadCourses = async () => {
      let fetchedCourses: Course[];
      if (isAdmin) {
        const { data } = await supabase.from('courses').select('*').order('created_at');
        fetchedCourses = (data as Course[]) || [];
      } else {
        fetchedCourses = await contentCardService.getCourses();
      }
      setCourses(fetchedCourses);

      // Count lessons per course
      const counts: Record<string, number> = {};
      for (const course of fetchedCourses) {
        try {
          const mods = await contentCardService.getModules(course.id);
          let total = 0;
          for (const m of mods) {
            const ls = await contentCardService.getLessons(m.id);
            total += ls.length;
          }
          counts[course.id] = total;
        } catch {
          counts[course.id] = 0;
        }
      }
      setLessonCounts(counts);
      setLoading(false);
    };
    void loadCourses();
  }, [isAdmin]);

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

  return (
    <MainLayout>
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <header className="mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">{t('courses_title')}</h1>
          <p className="text-muted-foreground font-medium">{t('courses_subtitle')}</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            {courses.map((course) => {
              const count = lessonCounts[course.id] ?? 0;
              const levelStyle = LEVEL_COLORS[course.level] ?? LEVEL_COLORS.beginner;
              const isComingSoon = !course.is_published && !isAdmin;

              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4 }}
                  className={`bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 flex flex-col transition-all group relative overflow-hidden ${
                    isComingSoon
                      ? 'opacity-70'
                      : 'active:border-accent-primary md:hover:border-accent-primary'
                  }`}
                >
                  <div className="absolute top-0 right-0 p-8 text-accent-primary/5 group-hover:scale-110 transition-transform duration-700">
                    {getCourseIcon(course.slug)}
                  </div>

                  <div className="flex items-start gap-4 mb-4 md:mb-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-accent-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-accent-primary shrink-0 border border-accent-primary/20">
                      {getCourseIcon(course.slug)}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelStyle}`}>
                        {t(getLevelKey(course.level) as Parameters<typeof t>[0])}
                      </span>
                      {count > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-2 text-muted-foreground border border-border">
                          <BookOpen size={10} /> {t('courses_lessons_count').replace('{n}', String(count))}
                        </span>
                      )}
                      {!course.is_published && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-warning/10 text-accent-warning border border-accent-warning/20">
                          <Clock size={10} /> {t('courses_coming_soon')}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg md:text-xl font-black mb-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-5 md:mb-6 leading-relaxed line-clamp-3">
                    {course.description || t('courses_default_desc')}
                  </p>

                  {isAdmin && !course.is_published && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-border px-2 py-0.5 rounded-full mb-3 inline-block">
                      {t('admin_draft')}
                    </span>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
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
                      <button
                        onClick={() => navigate(`/dashboard?course=${course.slug}`)}
                        className="bg-accent-primary text-white p-3 rounded-xl md:rounded-2xl active:scale-95 md:hover:scale-110 transition-all shadow-lg shadow-accent-primary/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <ArrowRight size={20} />
                      </button>
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
