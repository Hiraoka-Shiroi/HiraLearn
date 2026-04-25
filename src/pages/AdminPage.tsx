import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { Lesson } from '@/types/database';

interface LessonWithModule extends Lesson {
  modules: { title: string } | null;
}

export const AdminPage = () => {
  const [lessons, setLessons] = useState<LessonWithModule[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*, modules(title)')
      .order('order_index');
    setLessons((data as LessonWithModule[]) || []);
    setLoading(false);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) {
      alert('Ошибка при удалении: ' + error.message);
    } else {
      setLessons(lessons.filter(l => l.id !== lessonId));
    }
  };

  return (
    <MainLayout>
      <div className="p-8 md:p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin_title')}</h1>
            <p className="text-muted">{t('admin_subtitle')}</p>
          </div>
          <button
            onClick={() => alert('Создание уроков скоро будет доступно')}
            className="bg-accent-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            <span>{t('admin_create')}</span>
          </button>
        </header>

        <div className="bg-card border border-border rounded-[2rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">Title</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">Module</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">Order</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-muted">{t('admin_loading')}</td></tr>
              ) : lessons.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-muted">{t('admin_empty')}</td></tr>
              ) : (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-6 font-bold">{lesson.title}</td>
                    <td className="p-6 text-sm text-muted">{lesson.modules?.title}</td>
                    <td className="p-6 text-sm font-mono">{lesson.order_index}</td>
                    <td className="p-6">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all"
                          title="Просмотр"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => alert('Редактирование скоро будет доступно')}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-accent-primary transition-all"
                          title="Редактировать"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(lesson.id)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-accent-danger transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};
