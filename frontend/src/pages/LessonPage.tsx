
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentCardService, progressService } from '@/lib/supabase/services';
import { useAuthStore } from '@/store/useAuthStore';
import { Lesson, Task } from '@/types/database';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, Lightbulb, CheckCircle2, XCircle, Info, ArrowRight, Sparkles, BookOpen,
} from 'lucide-react';
import { checkHTML, ValidationResult } from '@/lib/validators/htmlChecker';
import { trackEvent } from '@/lib/firebase/analytics';
import { useLanguage } from '@/i18n/useLanguage';

interface CompletionFeedback {
  xp: number;
  leveledUp: boolean;
  newLevel: number;
}

export const LessonPage: React.FC = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuthStore();
  const { t } = useLanguage();

  const [lesson, setLesson] = useState<Lesson & { tasks: Task[] } | null>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<CompletionFeedback | null>(null);

  const task: Task | null = lesson && lesson.tasks.length > 0 ? lesson.tasks[0] : null;
  const isTheoryOnly = lesson && lesson.tasks.length === 0;

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
    if (!task) return;
    const validation = checkHTML(code, task.validation_rules);
    setResult(validation);
    if (validation.isCorrect) setShowHint(false);
  };

  const handleComplete = async () => {
    if (!user || !lesson) return;
    setSubmitting(true);
    try {
      const { profile: nextProfile, xpAwarded, leveledUp } =
        await progressService.completeLesson(lesson.id, profile);
      setProfile(nextProfile);
      void trackEvent('lesson_complete', { lesson_id: lesson.id, xp: xpAwarded });
      setFeedback({
        xp: xpAwarded,
        leveledUp,
        newLevel: nextProfile.level ?? 1,
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissFeedback = () => {
    setFeedback(null);
    navigate('/dashboard');
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-accent-primary">{t('lesson_loading')}</div>;
  if (!lesson) return <div className="min-h-screen bg-background flex items-center justify-center text-muted">{t('lesson_not_found')}</div>;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-14 md:h-16 border-b border-border px-3 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 active:bg-card md:hover:bg-card rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-sm md:text-base truncate">{lesson.title}</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{t('lesson_module')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-xs font-bold text-accent-primary">+{lesson.xp_reward} XP</span>
             <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent-primary transition-all" style={{ width: result?.isCorrect || isTheoryOnly ? '100%' : '0%' }} />
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Theory & Task */}
        <section className={`w-full overflow-y-auto p-4 md:p-10 custom-scrollbar ${isTheoryOnly ? '' : 'md:w-1/2 border-r border-border'}`}>
          <div className="max-w-xl mx-auto">
            <div className="bg-accent-primary/5 border border-accent-primary/10 rounded-xl md:rounded-2xl p-3 md:p-4 mb-5 md:mb-8 flex gap-3 md:gap-4">
              <div className="shrink-0 w-9 h-9 md:w-10 md:h-10 bg-accent-primary text-white rounded-lg md:rounded-xl flex items-center justify-center">
                <Info size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1 text-accent-primary">{t('lesson_theory')}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {lesson.theory}
                </p>
              </div>
            </div>

            {isTheoryOnly ? (
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-accent-success/10 text-accent-success flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold">{t('lesson_no_task')}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t('lesson_no_task_desc')}</p>
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="w-full bg-accent-success active:bg-accent-success/90 md:hover:bg-accent-success/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-success/20 min-h-[44px] py-3 disabled:opacity-60"
                >
                  {submitting ? t('lesson_completing') : t('lesson_complete')} <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 md:mb-10">
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{t('lesson_task')}</h2>
                  <p className="text-foreground/80 leading-relaxed">{task?.description}</p>
                </div>

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
                        {task?.hints?.[0] || (() => {
                          const rules = task?.validation_rules;
                          if (!rules) return t('lesson_hint_default');
                          const parts: string[] = [];
                          if (rules.requiredTags?.length) parts.push(t('lesson_hint_use_tag').replace('{tag}', rules.requiredTags[0]));
                          if (rules.requiredText?.length) parts.push(t('lesson_hint_must_contain').replace('{text}', rules.requiredText[0]));
                          return parts.length > 0 ? parts.join('. ') : t('lesson_hint_default');
                        })()}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </section>

        {/* Right: Code Editor & Preview (only when there's a task) */}
        {!isTheoryOnly && (
          <section className="w-full md:w-1/2 flex flex-col bg-[#0d1117] min-h-[40vh]">
            <div className="h-10 border-b border-white/5 flex px-4">
              <div className="h-full border-b-2 border-accent-primary px-4 flex items-center text-xs font-medium text-white">
                index.html
              </div>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 md:p-6 bg-transparent text-gray-300 font-mono text-sm resize-none outline-none caret-accent-primary"
                spellCheck={false}
              />
            </div>

            <div className="bg-card border-t border-border p-3 md:p-4 flex flex-col gap-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      result.isCorrect ? 'bg-accent-success/5 border-accent-success/20' : 'bg-accent-danger/5 border-accent-danger/20'
                    }`}
                  >
                    {result.isCorrect
                      ? <CheckCircle2 className="text-accent-success shrink-0" size={18} />
                      : <XCircle className="text-accent-danger shrink-0" size={18} />}
                    <div>
                      <p className={`text-sm font-bold ${result.isCorrect ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {result.isCorrect ? t('lesson_correct') : t('lesson_errors')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{result.feedback}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="px-3 md:px-4 py-2.5 border border-border rounded-xl active:bg-card md:hover:bg-card transition-colors flex items-center gap-2 text-xs md:text-sm font-medium min-h-[44px]"
                >
                  <Lightbulb size={16} /> <span className="hidden md:inline">{showHint ? t('lesson_hide_hint') : t('lesson_show_hint')}</span>
                </button>

                {result?.isCorrect ? (
                  <button
                    onClick={handleComplete}
                    disabled={submitting}
                    className="flex-1 bg-accent-success active:bg-accent-success/90 md:hover:bg-accent-success/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-success/20 min-h-[44px] py-3 disabled:opacity-60"
                  >
                    {submitting ? t('lesson_completing') : t('lesson_complete')} <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleCheck}
                    className="flex-1 bg-accent-primary active:bg-accent-primary/90 md:hover:bg-accent-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 min-h-[44px] py-3"
                  >
                    <Play size={16} fill="currentColor" /> {t('lesson_check')}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Completion / level-up modal */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={handleDismissFeedback}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="bg-card rounded-2xl p-6 md:p-8 max-w-sm w-full text-center border border-border shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: feedback.leveledUp ? [0, -6, 6, 0] : 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280 }}
                className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  feedback.leveledUp
                    ? 'bg-gradient-to-br from-accent-warning to-accent-primary text-white'
                    : 'bg-accent-success/10 text-accent-success'
                }`}
              >
                {feedback.leveledUp ? <Sparkles size={28} /> : <CheckCircle2 size={28} />}
              </motion.div>

              <h3 className="text-xl md:text-2xl font-bold mb-1">
                {feedback.leveledUp ? t('lesson_level_up_title') : t('lesson_correct')}
              </h3>
              {feedback.leveledUp && (
                <p className="text-sm text-muted-foreground mb-2">
                  {t('lesson_level_up_desc').replace('{level}', String(feedback.newLevel))}
                </p>
              )}
              {feedback.xp > 0 && (
                <p className="text-base font-semibold text-accent-primary mb-4">
                  {t('lesson_xp_gained').replace('{xp}', String(feedback.xp))}
                </p>
              )}

              <button
                onClick={handleDismissFeedback}
                className="w-full bg-accent-primary text-white rounded-xl font-bold min-h-[44px] py-3"
              >
                {t('lesson_continue')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
