
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { useAuthStore } from '@/store/useAuthStore';
import { Lesson, Task } from '@/types/database';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Lightbulb, CheckCircle2, XCircle, Info, ArrowRight } from 'lucide-react';
import { checkHTML, ValidationResult } from '@/lib/validators/htmlChecker';
import { trackEvent } from '@/lib/firebase/analytics';
import { useLanguage } from '@/i18n/useLanguage';

export const LessonPage: React.FC = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  const [lesson, setLesson] = useState<Lesson & { tasks: Task[] } | null>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lessonId) {
      void trackEvent('lesson_start', { lesson_id: lessonId });
      contentCardService.getLessonWithTasks(lessonId).then(data => {
        setLesson(data);
        if (data.tasks.length > 0) {
          setCode(data.tasks[0].starter_code);
        }
        setLoading(false);
      });
    }
  }, [lessonId]);

  const handleCheck = () => {
    if (!lesson || lesson.tasks.length === 0) return;

    const task = lesson.tasks[0];
    const validation = checkHTML(code, task.validation_rules);
    setResult(validation);

    if (validation.isCorrect) {
      setShowHint(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !lesson) return;
    setSubmitting(true);
    try {
      await progressService.completeLesson(user.id, lesson.id, lesson.xp_reward);
      void trackEvent('lesson_complete', { lesson_id: lesson.id, xp: lesson.xp_reward });
      navigate('/dashboard');
    } catch (error) {
      console.error("Error completing lesson:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-accent-primary">{t('lesson_loading')}</div>;
  if (!lesson) return <div className="min-h-screen bg-background flex items-center justify-center text-muted">{t('lesson_not_found')}</div>;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-card rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-sm md:text-base">{lesson.title}</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t('lesson_module')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-xs font-bold text-accent-primary">+{lesson.xp_reward} XP</span>
             <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent-primary transition-all" style={{ width: result?.isCorrect ? '100%' : '0%' }} />
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Theory & Task */}
        <section className="w-full md:w-1/2 overflow-y-auto p-6 md:p-10 border-r border-border custom-scrollbar">
          <div className="max-w-xl mx-auto">
            <div className="bg-accent-primary/5 border border-accent-primary/10 rounded-2xl p-4 mb-8 flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-accent-primary text-white rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1 text-accent-primary">{t('lesson_theory')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {lesson.theory}
                </p>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{t('lesson_task')}</h2>
              <p className="text-foreground/80 leading-relaxed">
                {lesson.tasks[0]?.description}
              </p>
            </div>

            {/* Hint Section */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-accent-warning/5 border border-accent-warning/20 rounded-2xl p-4 mb-6"
                >
                  <div className="flex items-center gap-2 text-accent-warning font-bold text-xs uppercase mb-2">
                    <Lightbulb size={14} /> {t('lesson_hint_title')}
                  </div>
                  <p className="text-sm text-foreground/70">
                    {lesson.tasks?.[0]?.hints?.[0] ?? ''}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right: Code Editor & Preview */}
        <section className="w-full md:w-1/2 flex flex-col bg-[#0d1117]">
          {/* Editor Tabs */}
          <div className="h-10 border-b border-white/5 flex px-4">
            <div className="h-full border-b-2 border-accent-primary px-4 flex items-center text-xs font-medium text-white">
              index.html
            </div>
          </div>

          {/* Actual Editor */}
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-transparent text-gray-300 font-mono text-sm resize-none outline-none caret-accent-primary"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Results Bar */}
          <div className="bg-card border-t border-border p-4 flex flex-col gap-3">
             <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      result.isCorrect ? 'bg-accent-success/5 border-accent-success/20' : 'bg-accent-danger/5 border-accent-danger/20'
                    }`}
                  >
                    {result.isCorrect ? (
                      <CheckCircle2 className="text-accent-success shrink-0" size={18} />
                    ) : (
                      <XCircle className="text-accent-danger shrink-0" size={18} />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${result.isCorrect ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {result.isCorrect ? t('lesson_correct') : t('lesson_errors')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{result.feedback}</p>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>

             <div className="flex gap-3">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="px-4 py-2 border border-border rounded-xl hover:bg-card transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Lightbulb size={16} /> {showHint ? t('lesson_hide_hint') : t('lesson_show_hint')}
                </button>

                {result?.isCorrect ? (
                  <button
                    onClick={handleComplete}
                    disabled={submitting}
                    className="flex-1 bg-accent-success hover:bg-accent-success/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-success/20"
                  >
                    {submitting ? t('lesson_completing') : t('lesson_complete')} <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleCheck}
                    className="flex-1 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20"
                  >
                    <Play size={16} fill="currentColor" /> {t('lesson_check')}
                  </button>
                )}
             </div>
          </div>
        </section>
      </main>
    </div>
  );
};
