import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Trash2, ArrowLeft, Edit2, Search, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/useLanguage';
import { Module } from '@/types/database';

interface ModuleWithCourse extends Module {
  courses: { title: string } | null;
}

interface ModuleFormData {
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_published: boolean;
}

const emptyForm: ModuleFormData = {
  title: '',
  description: '',
  course_id: '',
  order_index: 0,
  is_published: false,
};

export const AdminModulesPage = () => {
  const [modules, setModules] = useState<ModuleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ModuleFormData>(emptyForm);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    void loadModules();
    void loadCourses();
  }, []);

  const loadModules = async () => {
    const { data } = await supabase
      .from('modules')
      .select('*, courses(title)')
      .order('order_index');
    setModules((data as unknown as ModuleWithCourse[]) || []);
    setLoading(false);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('id, title').order('created_at');
    setCourses(data || []);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.courses?.title ?? '').toLowerCase().includes(q),
    );
  }, [modules, query]);

  const handleDelete = async (moduleId: string) => {
    if (!confirm(t('common_delete') + '?')) return;
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (error) {
      alert(t('common_error') + ': ' + error.message);
    } else {
      setModules(modules.filter((m) => m.id !== moduleId));
    }
  };

  const handleTogglePublish = async (mod: ModuleWithCourse) => {
    const newVal = !mod.is_published;
    const { data, error } = await supabase
      .from('modules')
      .update({ is_published: newVal })
      .eq('id', mod.id)
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
    setModules(modules.map((m) => m.id === mod.id ? { ...m, is_published: newVal } : m));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (mod: ModuleWithCourse) => {
    setEditingId(mod.id);
    setForm({
      title: mod.title,
      description: mod.description || '',
      course_id: mod.course_id,
      order_index: mod.order_index,
      is_published: mod.is_published,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.course_id) return;
    setSaving(true);
    const payload = {
      title: form.title,
      slug: form.title.toLowerCase().replace(/\s+/g, '-'),
      description: form.description,
      course_id: form.course_id,
      order_index: form.order_index,
      is_published: form.is_published,
    };

    if (editingId) {
      const { error } = await supabase.from('modules').update(payload).eq('id', editingId);
      if (error) { alert(t('common_error') + ': ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('modules').insert(payload);
      if (error) { alert(t('common_error') + ': ' + error.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowForm(false);
    void loadModules();
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
            <h1 className="text-3xl font-bold mb-2">{t('admin_modules_title')}</h1>
            <p className="text-muted">{t('admin_modules_subtitle')}</p>
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
                    {t('admin_module_name')}
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('admin_module_course')}
                  </label>
                  <select
                    value={form.course_id}
                    onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">-- --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('admin_module_desc')}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                    {t('admin_order')}
                  </label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
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
                  disabled={saving || !form.title.trim() || !form.course_id}
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
                  {t('admin_module_name')}
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">
                  {t('admin_module_course')}
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted">
                  {t('admin_order')}
                </th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-muted text-right">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted">
                    {t('admin_loading')}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted">
                    {t('admin_empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((mod) => (
                  <tr key={mod.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-6">
                      <div className="font-bold">{mod.title}</div>
                      {!mod.is_published && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted bg-border px-2 py-0.5 rounded-full">
                          {t('admin_draft')}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-sm text-muted">{mod.courses?.title}</td>
                    <td className="p-6 text-sm font-mono">{mod.order_index}</td>
                    <td className="p-6">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleTogglePublish(mod)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all"
                          title={mod.is_published ? t('admin_unpublish') : t('admin_publish')}
                        >
                          {mod.is_published ? (
                            <ToggleRight size={18} className="text-accent-success" />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(mod)}
                          className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all"
                          title={t('common_edit')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(mod.id)}
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
