import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

export const AdminPage = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*, modules(title)')
      .order('order_index');
    setLessons(data || []);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted">Manage courses, lessons and user data.</p>
          </div>
          <button className="bg-accent-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:scale-105 transition-all">
            <Plus size={20} />
            <span>Create Lesson</span>
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
                <tr><td colSpan={4} className="p-12 text-center text-muted">Loading lessons...</td></tr>
              ) : lessons.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-muted">No lessons found.</td></tr>
              ) : (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-6 font-bold">{lesson.title}</td>
                    <td className="p-6 text-sm text-muted">{lesson.modules?.title}</td>
                    <td className="p-6 text-sm font-mono">{lesson.order_index}</td>
                    <td className="p-6">
                      <div className="flex justify-end space-x-2">
                        <button className="p-2 rounded-lg hover:bg-border text-muted hover:text-foreground transition-all">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-border text-muted hover:text-accent-primary transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-border text-muted hover:text-danger transition-all">
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
      </main>
    </div>
  );
};
