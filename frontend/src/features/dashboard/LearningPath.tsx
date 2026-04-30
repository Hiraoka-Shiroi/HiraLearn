/**
 * Vertical learning path for the active course. Unlike the previous
 * flat list, each module now has a themed CourseBadge + soft colour
 * gradient; each lesson node shows its XP reward and state.
 *
 * This component is "dumb" on purpose — it only renders the passed
 * lessons. Data fetching lives in `Dashboard.tsx`.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Sparkles, BookOpen } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { CourseBadge } from '@/components/illustrations/CourseBadge';
import type { Module, Lesson } from '@/types/database';

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

interface LearningPathProps {
  modules: ModuleWithLessons[];
  completedIds: Set<string>;
  nextLessonId: string | null;
}

export const LearningPath: React.FC<LearningPathProps> = ({
  modules, completedIds, nextLessonId,
}) => {
  const { t } = useLanguage();

  if (modules.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-dashed border-border p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-3">
          <BookOpen size={26} />
        </div>
        <p className="font-bold mb-1">{t('dash_path_empty_title')}</p>
        <p className="text-sm text-muted-foreground">{t('dash_path_empty_sub')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {modules.map((module, idx) => (
        <ModulePath
          key={module.id}
          module={module}
          index={idx}
          completedIds={completedIds}
          nextLessonId={nextLessonId}
        />
      ))}
    </div>
  );
};

interface ModulePathProps {
  module: ModuleWithLessons;
  index: number;
  completedIds: Set<string>;
  nextLessonId: string | null;
}

const ModulePath: React.FC<ModulePathProps> = ({ module, index, completedIds, nextLessonId }) => {
  const { t } = useLanguage();
  const total = module.lessons.length;
  const done = module.lessons.filter(l => completedIds.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const moduleStarted = done > 0 || module.lessons.some(l => l.id === nextLessonId);
  const allDone = done === total && total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {/* Module header card */}
      <div className={`rounded-2xl border p-3.5 md:p-4 mb-3 flex items-center gap-3 md:gap-4 ${
        allDone
          ? 'bg-accent-success/5 border-accent-success/20'
          : moduleStarted
            ? 'bg-card border-accent-primary/30 shadow-glow-primary'
            : 'bg-card border-border'
      }`}>
        <CourseBadge kind={module.title} sizeClass="w-11 h-11 md:w-12 md:h-12" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              {t('dash_module')} {index + 1}
            </span>
            {allDone && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-success flex items-center gap-1">
                <CheckCircle2 size={11} /> {t('dash_module_done')}
              </span>
            )}
          </div>
          <h3 className="text-base md:text-lg font-black truncate">{module.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-surface-1 overflow-hidden max-w-[220px]">
              <div
                className={`h-full ${allDone ? 'bg-accent-success' : 'bg-accent-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              {done}/{total}
            </span>
          </div>
        </div>
      </div>

      {/* Lesson nodes */}
      <ol className="relative pl-2 md:pl-4">
        <span className="absolute left-[22px] md:left-[26px] top-3 bottom-3 w-[2px] bg-border" aria-hidden />
        {module.lessons.map((lesson, i) => {
          const isCompleted = completedIds.has(lesson.id);
          const isCurrent = lesson.id === nextLessonId;
          const isLocked = !isCompleted && !isCurrent;
          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              order={i + 1}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isLocked={isLocked}
            />
          );
        })}
      </ol>
    </motion.div>
  );
};

interface LessonNodeProps {
  lesson: Lesson;
  order: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

const LessonNode: React.FC<LessonNodeProps> = ({ lesson, order, isCompleted, isCurrent, isLocked }) => {
  const { t } = useLanguage();

  const dotColor = isCompleted
    ? 'bg-accent-success text-white shadow-glow-success'
    : isCurrent
      ? 'bg-accent-primary text-white shadow-glow-primary'
      : 'bg-surface-1 text-muted-foreground border-2 border-dashed border-border';

  const cardColor = isCompleted
    ? 'bg-accent-success/5 border-accent-success/15 hover:border-accent-success/30'
    : isCurrent
      ? 'bg-card border-accent-primary/40 hover:border-accent-primary/60 shadow-glow-primary'
      : 'bg-card/60 border-border opacity-80';

  const inner = (
    <li className="relative pl-11 md:pl-12 pb-3 last:pb-0">
      <span
        className={`absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center font-black text-xs ${dotColor}`}
      >
        {isCurrent && (
          <motion.span
            className="absolute inset-0 rounded-full bg-accent-primary/30"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {isCompleted ? <CheckCircle2 size={16} /> : isLocked ? <Lock size={12} /> : order}
      </span>

      <div className={`block p-3.5 rounded-xl border transition-all ${cardColor} min-h-[56px]`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-sm mb-0.5 truncate">{lesson.title}</h4>
            <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isCompleted ? 'text-accent-success' : isCurrent ? 'text-accent-primary' : 'text-muted-foreground'
            }`}>
              {isCompleted
                ? t('lesson_done')
                : isCurrent
                  ? (<><Sparkles size={11} /> {t('dash_continue')}</>)
                  : `+${lesson.xp_reward} XP`}
            </p>
          </div>
          <ArrowRight size={16} className={isLocked ? 'text-muted-foreground/40' : 'text-accent-primary'} />
        </div>
      </div>
    </li>
  );

  if (isLocked) return inner;

  return (
    <Link to={`/lessons/${lesson.id}`} className="block">
      {inner}
    </Link>
  );
};
