
import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { contentCardService } from '@/lib/supabase/services';
import { Course } from '@/types/database';
import { motion } from 'framer-motion';
import { Book, Layout, Code, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    contentCardService.getCourses().then(data => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

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
          <h1 className="text-4xl font-black mb-2 tracking-tight">Библиотека курсов</h1>
          <p className="text-muted-foreground font-medium">Выбери свою специализацию и начни путь мастера.</p>
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
                  {course.description || 'Изучите основы и продвинутые концепции этой технологии через практику и реальные проекты.'}
                </p>

                <div className="mt-auto flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <ShieldCheck className="text-accent-success" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-accent-success">Сертификат</span>
                   </div>
                   <button
                     onClick={() => navigate('/dashboard')}
                     className="bg-accent-primary text-white p-3 rounded-2xl hover:scale-110 transition-all shadow-lg shadow-accent-primary/20"
                   >
                     <ArrowRight size={20} />
                   </button>
                </div>
              </motion.div>
            ))}

            {/* Coming Soon Course */}
            <div className="bg-card/50 border-2 border-dashed border-border rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center opacity-60">
               <div className="w-16 h-16 bg-border rounded-2xl flex items-center justify-center text-muted-foreground mb-6">
                 <Terminal size={32} />
               </div>
               <h3 className="text-xl font-bold mb-2">Advanced React</h3>
               <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Скоро в додзё</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
