
import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { contentCardService } from '@/lib/supabase/services';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types/database';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { Book, Layout, Code, Terminal, ArrowRight, ShieldCheck, Trash2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const loadCourses = async () => {
      if (isAdmin) {
        const { data } = await supabase.from('courses').select('*').order('created_at');
        setCourses((data as Course[]) || []);
      } else {
        const data = await contentCardService.getCourses();
        setCourses(data);
      }
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

  const getCourseIcon = (slug: string) => {
    if (slug.includes('html')) return <Layout size={32} />;
    if (slug.includes('frontend')) return <Code size={32} />;
    if (slug.includes('js')) return <Terminal size={32} />;
    return <Book size={32} />;
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black mb-2 tracking-tight">{t('courses_title')}</h1>
          <p className="text-muted-foreground font-medium">{t('courses_subtitle')}</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -8 }}
                className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col hover:border-accent-primary transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-accent-primary/5 group-hover:scale-110 transition-transform duration-700">
                   {getCourseIcon(course.slug)}
                </div>

                <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary mb-8 border border-accent-primary/20">
                  {getCourseIcon(course.slug)}
                </div>

                <h3 className="text-2xl font-black mb-3">{course.title}</h3>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  {course.description || t('courses_default_desc')}
                </p>

                {isAdmin && !course.is_published && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-border px-2 py-0.5 rounded-full mb-4 inline-block">
                    {t('admin_draft')}
                  </span>
                )}

                <div className="mt-auto flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <ShieldCheck className="text-accent-success" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-accent-success">{t('courses_certificate')}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     {isAdmin && (
                       <>
                         <button
                           onClick={(e) => { e.stopPropagation(); handleTogglePublish(course); }}
                           className="p-2 rounded-xl hover:bg-border text-muted hover:text-foreground transition-all"
                           title={course.is_published ? t('admin_unpublish') : t('admin_publish')}
                         >
                           {course.is_published ? <EyeOff size={16} /> : <Eye size={16} className="text-accent-success" />}
                         </button>
                         <button
                           onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                           className="p-2 rounded-xl hover:bg-accent-danger/10 text-muted hover:text-accent-danger transition-all"
                           title={t('common_delete')}
                         >
                           <Trash2 size={16} />
                         </button>
                       </>
                     )}
                     <button
                       onClick={() => navigate(`/dashboard?course=${course.slug}`)}
                       className="bg-accent-primary text-white p-3 rounded-2xl hover:scale-110 transition-all shadow-lg shadow-accent-primary/20"
                     >
                       <ArrowRight size={20} />
                     </button>
                   </div>
                </div>
              </motion.div>
            ))}

            {/* Coming Soon Course */}
            <div className="bg-card/50 border-2 border-dashed border-border rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center opacity-60">
               <div className="w-16 h-16 bg-border rounded-2xl flex items-center justify-center text-muted-foreground mb-6">
                 <Terminal size={32} />
               </div>
               <h3 className="text-xl font-bold mb-2">Advanced React</h3>
               <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('courses_coming_soon')}</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
