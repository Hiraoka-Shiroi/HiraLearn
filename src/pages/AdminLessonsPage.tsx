import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Trash2, Eye, ArrowLeft, Edit2, Search, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { Lesson } from '@/types/database';

interface LessonWithModule extends Lesson {
  modules: { title: string } | null;
}

interface LessonFormData {
  title: string;
  slug: string;
  theory: string;
  example_code: string;
  module_id: string;
  order_index: number;
  xp_reward: number;
  is_published: boolean;
}

const emptyForm: LessonFormData = {
  title: '',
  slug: '',
  theory: '',
  example_code: '',
  module_id: '',
  order_index: 0,
  xp_reward: 50,
  is_published: false,
};

export const AdminLessonsPage = () => {
  const [lessons, setLessons] = useState<LessonWithModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LessonFormData>(emptyForm);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    void loadLessons();
    void loadModules();
  }, []);

  const loadLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*, modules(title)')
      .order('order_index');
    setLessons((data as unknown as LessonWithModule[]) || []);
    setLoading(false);
  };

  const loadModules = async () => {
    const { data } = await supabase.from('modules').select('id, title').order('order_index');
    setModules(data || []);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.modules?.title ?? '').toLowerCase().includes(q),
    );
  }, [lessons, query]);

  const handleDelete = async (lessonId: string) => {
    const confirmMsg = t('common_delete') + '?';
    if (!confirm(confirmMsg)) return;
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) {
      alert(t('common_error') + ': ' + error.message);
    } else {
      setLessons(lessons.filter((l) => l.id !== lessonId));
    }
  };

  const handleTogglePublish = async (lesson: LessonWithModule) => {
    const { error } = await supabase
      .from('lessons')
      .update({ is_published: !lesson.is_published })
      .eq('id', lesson.id);
    if (!error) {
      setLessons(
        lessons.map((l) =>
          l.id === lesson.id ? { ...l, is_published: !l.is_published } : l,
        ),
      );
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (lesson: LessonWithModule) => {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title,
      slug: lesson.slug,
      theory: lesson.theory || '',
      example_code: lesson.example_code || '',
      module_id: lesson.module_id,
      order_index: lesson.order_index,
      xp_reward: lesson.xp_reward,
      is_published: lesson.is_published,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.module_id) return;
    setSaving(true);
    const payload = {
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-'),
      theory: form.theory,
      example_code: form.example_code,
      module_id: form.module_id,
      order_index: form.order_index,
      xp_reward: form.xp_reward,
      is_published: form.is_published,
    };

    if (editingId) {
      const { error } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        alert(t('common_error') + ': ' + error.message);
      }
    } else {
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) {
        alert(t('common_error') + ': ' + error.message);
      }
    }

    setSaving(false);
    setShowForm(false);
    void loadLessons();
  };

  return (
    <MainLayout>
      <div className="p-8 md:p-12">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-muted hover:text-foreground mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          {t('admin_back_to_console')}
        </button>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin_title')}</h1>
            <p className="text-muted">{t('admin_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common_search')}
                className="bg-background border border-border rounded-2xl pl-9 pr-4 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent-primary w-52"
              />
            </div>
            <button
              onClick={openCreate}
              className="bg-accent-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:scale-105 transition-all"
            >
              <Plus size={20} />
              <span>{t('admin_create')}</span>
            </button>
          </div>
        </header>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingId ? t('common_edit') : t('admin_create')}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-border rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('admin_lesson_col_title')}
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder={form.title.toLowerCase().replace(/\s+/g, '-')}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('admin_lesson_col_module')}
                  </label>
                  <select
                    value={form.module_id}
                    onChange={(e) => setForm({ ...form, module_id: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">-- --</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('lesson_theory')}
                  </label>
                  <textarea
                    value={form.theory}
                    onChange={(e) => setForm({ ...form, theory: e.target.value })}
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('admin_example_code')}
                  </label>
                  <textarea
                    value={form.example_code}
                    onChange={(e) => setForm({ ...form, example_code: e.target.value })}
                    rows={3}
                    placeholder="<h1>Hello World</h1>"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent-primary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                      #
                    </label>
                    <input
                      type="number"
                      value={form.order_index}
                      onChange={(e) =>
                        setForm({ ...form, order_index: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                      XP
                    </label>
                    <input
                      type="number"
                      value={form.xp_reward}
                      onChange={(e) =>
                        setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) =>
                      setForm({ ...form, is_published: e.target.checked })
                    }
                    className="w-4 h-4 accent-accent-primary"
                  />
                  <span className="text-sm font-medium">
                    {form.is_published ? t('admin_published') : t('admin_draft')}
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-border rounded-xl py-3 font-bold hover:bg-border transition-colors"
                >
                  {t('common_cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || !form.module_id}
                  className="flex-1 bg-accent-primary text-white rounded-xl py-3 font-bold hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? '...' : t('common_save')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">
                  {t('admin_lesson_col_title')}
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">
                  {t('admin_lesson_col_module')}
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">
                  #
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">
                  XP
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted text-right">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted">
                    {t('admin_loading')}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted">
                    {t('admin_empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-6">
                      <div className="font-bold">{lesson.title}</div>
                      {!lesson.is_published && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-border px-2 py-0.5 rounded-full">
                          {t('admin_draft')}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-sm text-muted">{lesson.modules?.title}</td>
                    <td className="p-6 text-sm font-mono">{lesson.order_index}</td>
                    <td className="p-6 text-sm font-mono">{lesson.xp_reward}</td>
                    <td className="p-6">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleTogglePublish(lesson)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all"
                          title={lesson.is_published ? t('admin_unpublish') : t('admin_publish')}
                        >
                          {lesson.is_published ? (
                            <ToggleRight size={18} className="text-accent-success" />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(lesson)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all"
                          title={t('common_edit')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all"
                          title={t('common_view')}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(lesson.id)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-accent-danger transition-all"
                          title={t('common_delete')}
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
