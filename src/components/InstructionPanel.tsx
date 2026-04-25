import { BookOpen, CheckCircle2 } from 'lucide-react';

interface InstructionPanelProps {
  lesson: any;
  task: any;
}

export const InstructionPanel = ({ lesson, task }: InstructionPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center space-x-2">
        <BookOpen size={18} className="text-accent-primary" />
        <h2 className="font-bold text-sm tracking-tight">{lesson.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Theory</h3>
          <div className="text-muted text-sm leading-relaxed prose prose-invert">
            {lesson.theory}
          </div>
        </section>

        {task && (
          <section className="p-5 rounded-[1.5rem] bg-background border border-border">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent-success mb-3 flex items-center">
              <CheckCircle2 size={12} className="mr-2" />
              Your Task
            </h4>
            <p className="text-sm font-medium leading-relaxed">
              {task.description}
            </p>
          </section>
        )}

        {task?.hints && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Sensei's Hint</h4>
            <div className="text-xs text-muted p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/10 italic leading-relaxed">
              "{task.hints[0] || 'Observe the patterns in the theory section.'}"
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
